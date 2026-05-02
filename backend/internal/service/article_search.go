package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/es"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/mq"
)

// SearchArticles ES 全文搜索文章
func (s *ArticleService) SearchArticles(ctx context.Context, keyword string) ([]map[string]interface{}, error) {
	if keyword == "" {
		return nil, fmt.Errorf("搜索关键词不能为空")
	}
	return es.Search(ctx, keyword)
}

// MaxwellDataDTO Maxwell CDC 消息（与原项目格式兼容）
type MaxwellDataDTO struct {
	Database string                 `json:"database"`
	Table    string                 `json:"table"`
	Type     string                 `json:"type"` // insert / update / delete
	Data     map[string]interface{} `json:"data"`
}

// StartMaxwellConsumer 启动 Maxwell CDC 消费者，同步文章数据到 ES
func StartMaxwellConsumer() {
	ch := mq.GetChannel()
	if ch == nil {
		log.Println("RabbitMQ channel 未就绪，Maxwell 消费者未启动")
		return
	}

	msgs, err := ch.Consume(mq.MaxwellQueue, "", false, false, false, false, nil)
	if err != nil {
		log.Printf("Maxwell 消费者启动失败: %v", err)
		return
	}

	go func() {
		for msg := range msgs {
			processMaxwellMessage(msg)
		}
	}()

	log.Println("Maxwell CDC 消费者已启动")
}

func processMaxwellMessage(msg amqp.Delivery) {
	var dto MaxwellDataDTO
	if err := json.Unmarshal(msg.Body, &dto); err != nil {
		log.Printf("解析 Maxwell 消息失败: %v", err)
		msg.Nack(false, false)
		return
	}

	// 只处理文章表
	if dto.Table != "tb_article" {
		msg.Ack(false)
		return
	}

	client := es.GetClient()
	if client == nil {
		msg.Nack(false, true)
		return
	}

	idRaw, ok := dto.Data["id"]
	if !ok {
		msg.Ack(false)
		return
	}
	articleID := fmt.Sprintf("%v", idRaw)

	switch dto.Type {
	case "insert", "update":
		doc := map[string]interface{}{
			"article_title":   dto.Data["article_title"],
			"article_content": dto.Data["article_content"],
			"status":          dto.Data["status"],
			"is_delete":       dto.Data["is_delete"],
		}
		body, _ := json.Marshal(doc)
		res, err := client.Index(es.ArticleIndex, bytes.NewReader(body),
			client.Index.WithDocumentID(articleID),
			client.Index.WithRefresh("true"),
		)
		if err != nil {
			log.Printf("ES 索引文章 %s 失败: %v", articleID, err)
			msg.Nack(false, true)
			return
		}
		defer res.Body.Close()
		// ES 返回 4xx/5xx 时底层 err 为 nil，必须显式检查
		if res.IsError() {
			log.Printf("ES 索引文章 %s 返回错误: %s", articleID, res.String())
			msg.Nack(false, true)
			return
		}

	case "delete":
		res, err := client.Delete(es.ArticleIndex, articleID,
			client.Delete.WithRefresh("true"),
		)
		if err != nil {
			log.Printf("ES 删除文章 %s 失败: %v", articleID, err)
			msg.Nack(false, true)
			return
		}
		defer res.Body.Close()
		// 404（文档不存在）不算错误，其他错误视为失败重投
		if res.IsError() && res.StatusCode != 404 {
			log.Printf("ES 删除文章 %s 返回错误: %s", articleID, res.String())
			msg.Nack(false, true)
			return
		}
	}

	msg.Ack(false)
}
