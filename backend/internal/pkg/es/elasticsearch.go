package es

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/elastic/go-elasticsearch/v7"
)

const ArticleIndex = "blog_article"

var client *elasticsearch.Client

// Init 初始化 Elasticsearch 客户端
func Init(addresses []string) {
	var err error
	client, err = elasticsearch.NewClient(elasticsearch.Config{
		Addresses: addresses,
	})
	if err != nil {
		log.Fatalf("Elasticsearch 客户端创建失败: %v", err)
	}

	// 检查连接
	res, err := client.Info()
	if err != nil {
		log.Fatalf("Elasticsearch 连接失败: %v", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		log.Fatalf("Elasticsearch 返回错误: %s", res.String())
	}

	// 注意：索引创建从启动路径移除，统一由 cmd/reindex 等运维命令显式调用
	// EnsureArticleIndex，避免启动阶段 IK 分析器缺失等问题被静默吞掉。
	log.Println("Elasticsearch 初始化完成")
}

// EnsureArticleIndex 创建文章索引（如不存在）；幂等。
// 返回真实错误而不是仅仅日志静默，由调用方决定是否阻塞流程。
func EnsureArticleIndex() error {
	if client == nil {
		return fmt.Errorf("Elasticsearch 客户端未初始化")
	}
	res, err := client.Indices.Exists([]string{ArticleIndex})
	if err != nil {
		return fmt.Errorf("检查索引失败: %w", err)
	}
	res.Body.Close()

	if res.StatusCode == 200 {
		return nil // 索引已存在
	}

	mapping := map[string]interface{}{
		"mappings": map[string]interface{}{
			"properties": map[string]interface{}{
				"article_title": map[string]interface{}{
					"type":     "text",
					"analyzer": "ik_max_word",
				},
				"article_content": map[string]interface{}{
					"type":     "text",
					"analyzer": "ik_max_word",
				},
				"status":    map[string]interface{}{"type": "integer"},
				"is_delete": map[string]interface{}{"type": "boolean"},
			},
		},
	}

	body, _ := json.Marshal(mapping)
	res, err = client.Indices.Create(ArticleIndex, client.Indices.Create.WithBody(bytes.NewReader(body)))
	if err != nil {
		return fmt.Errorf("创建文章索引失败: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("创建文章索引返回错误: %s", res.String())
	}
	log.Println("文章搜索索引创建成功")
	return nil
}

// Search 搜索文章
func Search(ctx context.Context, keyword string) ([]map[string]interface{}, error) {
	if client == nil {
		return nil, fmt.Errorf("Elasticsearch 客户端未初始化")
	}

	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": []map[string]interface{}{
					{
						"multi_match": map[string]interface{}{
							"query":  keyword,
							"fields": []string{"article_title", "article_content"},
						},
					},
				},
				"filter": []map[string]interface{}{
					{"term": map[string]interface{}{"is_delete": false}},
					{"term": map[string]interface{}{"status": 1}},
				},
			},
		},
		"_source": []string{"article_title", "article_content"},
		"highlight": map[string]interface{}{
			"pre_tags":  []string{"<em>"},
			"post_tags": []string{"</em>"},
			"fields": map[string]interface{}{
				"article_title":   map[string]interface{}{},
				"article_content": map[string]interface{}{"fragment_size": 200},
			},
		},
	}

	body, _ := json.Marshal(query)
	res, err := client.Search(
		client.Search.WithContext(ctx),
		client.Search.WithIndex(ArticleIndex),
		client.Search.WithBody(bytes.NewReader(body)),
	)
	if err != nil {
		return nil, fmt.Errorf("搜索失败: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("搜索返回错误: %s", res.String())
	}

	var result map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析搜索结果失败: %w", err)
	}

	hits, ok := result["hits"].(map[string]interface{})["hits"].([]interface{})
	if !ok {
		return nil, nil
	}

	articles := make([]map[string]interface{}, 0, len(hits))
	for _, hit := range hits {
		h := hit.(map[string]interface{})
		article := h["_source"].(map[string]interface{})
		article["id"] = h["_id"]
		if highlight, ok := h["highlight"]; ok {
			article["highlight"] = highlight
		}
		articles = append(articles, article)
	}
	return articles, nil
}

// GetClient 返回 ES 客户端供外部使用
func GetClient() *elasticsearch.Client {
	return client
}
