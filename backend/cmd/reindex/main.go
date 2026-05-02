// Package main 是文章全量 reindex 到 Elasticsearch 的运维命令。
//
// 用法：
//   go run ./cmd/reindex --batch 100
//
// 典型场景：
//   - ES 首次部署后做冷启动回填
//   - Maxwell CDC 中断期间错过的数据补录
//   - 索引 mapping 变更后重建
//
// 与 Maxwell CDC 的关系：CDC 负责增量，reindex 负责一次性全量。
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/config"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/es"
)

func main() {
	var (
		configPath = flag.String("config", "config.yaml", "配置文件路径")
		batchSize  = flag.Int("batch", 100, "每批处理文章数")
	)
	flag.Parse()

	if envCfg := os.Getenv("CONFIG_PATH"); envCfg != "" {
		*configPath = envCfg
	}

	config.Load(*configPath)
	cfg := config.AppConfig

	config.InitDatabase()
	es.Init(cfg.ES.Addresses)

	// 确保索引存在
	if err := es.EnsureArticleIndex(); err != nil {
		log.Fatalf("创建/校验 ES 索引失败: %v", err)
	}

	ctx := context.Background()
	if es.GetClient() == nil {
		log.Fatalf("ES 客户端未初始化")
	}

	var total int64
	if err := config.DB.Model(&model.Article{}).Count(&total).Error; err != nil {
		log.Fatalf("统计文章数失败: %v", err)
	}
	log.Printf("开始全量 reindex，文章总数 %d，批大小 %d", total, *batchSize)

	indexed := 0
	failed := 0
	offset := 0
	for {
		var batch []model.Article
		if err := config.DB.
			Order("id ASC").
			Limit(*batchSize).
			Offset(offset).
			Find(&batch).Error; err != nil {
			log.Fatalf("读取第 %d 批失败: %v", offset, err)
		}
		if len(batch) == 0 {
			break
		}

		for _, a := range batch {
			if err := indexOne(ctx, a); err != nil {
				log.Printf("文章 %d 索引失败: %v", a.ID, err)
				failed++
				continue
			}
			indexed++
		}
		offset += len(batch)
		log.Printf("已处理 %d / %d", offset, total)
	}

	log.Printf("reindex 完成：成功 %d，失败 %d", indexed, failed)
	if failed > 0 {
		os.Exit(1)
	}
}

// indexOne 将单篇文章同步到 ES
func indexOne(ctx context.Context, a model.Article) error {
	doc := map[string]interface{}{
		"article_title":   a.ArticleTitle,
		"article_content": a.ArticleContent,
		"status":          a.Status,
		"is_delete":       a.IsDelete,
	}
	body, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("序列化文档: %w", err)
	}

	esClient := es.GetClient()
	res, err := esClient.Index(
		es.ArticleIndex,
		bytes.NewReader(body),
		esClient.Index.WithContext(ctx),
		esClient.Index.WithDocumentID(fmt.Sprintf("%d", a.ID)),
	)
	if err != nil {
		return fmt.Errorf("ES Index 调用: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("ES 返回错误: %s", res.String())
	}
	return nil
}
