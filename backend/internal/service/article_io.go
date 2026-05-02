package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

// Scanner 缓冲上限：导入文件允许单行 10MB，足以处理长文正文。
const importScannerMaxBytes = 10 * 1024 * 1024

// ExportArticle 导出文章为 JSON 数组
func (s *ArticleService) ExportArticles(ctx context.Context, ids []int) ([]byte, error) {
	var articles []model.Article
	query := s.db.WithContext(ctx).Preload("Category").Preload("Tags")
	if len(ids) > 0 {
		query = query.Where("id IN ?", ids)
	}
	if err := query.Find(&articles).Error; err != nil {
		return nil, fmt.Errorf("查询文章失败: %w", err)
	}
	return json.MarshalIndent(articles, "", "  ")
}

// ImportArticles 导入文章
// 支持两种格式（round-trip 导出+导入）：
//  1. JSON：[]model.Article，即 ExportArticles 的输出
//  2. Hexo Markdown：以 --- 分隔的 front matter + 正文
//
// 返回成功导入条数；若部分条目导入失败，按条聚合错误通过 errors.Join 返回。
func (s *ArticleService) ImportArticles(ctx context.Context, reader io.Reader, userID int) (int, error) {
	// 读取全部输入（便于先 JSON 尝试再回退）。上游 handler 已做大小限制。
	raw, err := io.ReadAll(reader)
	if err != nil {
		return 0, fmt.Errorf("读取上传文件失败: %w", err)
	}

	// 1. 优先尝试 JSON 反序列化（与 ExportArticles 对齐）
	if articles, ok := tryParseArticleJSON(raw); ok {
		return s.saveImportedArticles(ctx, articles, userID)
	}

	// 2. 回退 Hexo Markdown 解析
	articles, err := parseHexoMarkdown(bytes.NewReader(raw))
	if err != nil {
		return 0, err
	}
	return s.saveImportedArticles(ctx, articles, userID)
}

// tryParseArticleJSON 尝试把导出 JSON 反序列化为导入请求；成功返回 ok=true
func tryParseArticleJSON(raw []byte) ([]SaveArticleRequest, bool) {
	var articles []model.Article
	if err := json.Unmarshal(raw, &articles); err != nil || len(articles) == 0 {
		return nil, false
	}
	reqs := make([]SaveArticleRequest, 0, len(articles))
	for _, a := range articles {
		req := SaveArticleRequest{
			ArticleTitle:   a.ArticleTitle,
			ArticleContent: a.ArticleContent,
			ArticleCover:   a.ArticleCover,
			Type:           a.Type,
			OriginalURL:    a.OriginalURL,
			IsTop:          a.IsTop,
			Status:         a.Status,
		}
		if a.Category != nil {
			req.CategoryName = a.Category.CategoryName
		}
		if len(a.Tags) > 0 {
			names := make([]string, 0, len(a.Tags))
			for _, t := range a.Tags {
				names = append(names, t.TagName)
			}
			req.TagNameList = names
		}
		// 字段为空的条目不视为可导入
		if req.ArticleTitle == "" || req.ArticleContent == "" {
			continue
		}
		reqs = append(reqs, req)
	}
	if len(reqs) == 0 {
		return nil, false
	}
	return reqs, true
}

// parseHexoMarkdown 解析 Hexo front matter 风格的 Markdown
func parseHexoMarkdown(r io.Reader) ([]SaveArticleRequest, error) {
	scanner := bufio.NewScanner(r)
	// 默认 64KB 单行上限容易被长段落截断；放大到 10MB。
	scanner.Buffer(make([]byte, 1024*1024), importScannerMaxBytes)

	var articles []SaveArticleRequest

	var currentTitle string
	var currentContent strings.Builder
	var currentTags []string
	var currentCategory string
	inFrontMatter := false
	frontMatterCount := 0

	for scanner.Scan() {
		line := scanner.Text()

		if line == "---" {
			frontMatterCount++
			if frontMatterCount == 1 {
				inFrontMatter = true
				continue
			}
			if frontMatterCount == 2 {
				inFrontMatter = false
				continue
			}
		}

		if inFrontMatter {
			// 解析 Hexo front matter
			if strings.HasPrefix(line, "title:") {
				currentTitle = strings.TrimSpace(strings.TrimPrefix(line, "title:"))
				currentTitle = strings.Trim(currentTitle, "\"'")
			} else if strings.HasPrefix(line, "categories:") || strings.HasPrefix(line, "category:") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					currentCategory = strings.TrimSpace(parts[1])
				}
			} else if strings.HasPrefix(line, "tags:") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					tagStr := strings.TrimSpace(parts[1])
					tagStr = strings.Trim(tagStr, "[]")
					for _, t := range strings.Split(tagStr, ",") {
						t = strings.TrimSpace(t)
						if t != "" {
							currentTags = append(currentTags, t)
						}
					}
				}
			} else if strings.HasPrefix(line, "- ") {
				// tags 列表格式
				tag := strings.TrimSpace(strings.TrimPrefix(line, "- "))
				if tag != "" {
					currentTags = append(currentTags, tag)
				}
			}
			continue
		}

		currentContent.WriteString(line + "\n")
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("扫描导入文件失败: %w", err)
	}

	if currentTitle != "" {
		articles = append(articles, SaveArticleRequest{
			ArticleTitle:   currentTitle,
			ArticleContent: strings.TrimSpace(currentContent.String()),
			CategoryName:   currentCategory,
			TagNameList:    currentTags,
			Type:           1,
			Status:         1,
		})
	}

	// 既没有 front matter 也没有标题时，把整个内容当作一篇文章
	if len(articles) == 0 && currentContent.Len() > 0 {
		articles = append(articles, SaveArticleRequest{
			ArticleTitle:   fmt.Sprintf("导入文章_%s", time.Now().Format("20060102150405")),
			ArticleContent: strings.TrimSpace(currentContent.String()),
			Type:           1,
			Status:         1,
		})
	}

	return articles, nil
}

// saveImportedArticles 批量持久化导入请求，聚合失败原因
func (s *ArticleService) saveImportedArticles(ctx context.Context, articles []SaveArticleRequest, userID int) (int, error) {
	imported := 0
	var errs []error
	for i, req := range articles {
		if err := s.SaveOrUpdate(ctx, req, userID); err != nil {
			errs = append(errs, fmt.Errorf("第 %d 篇「%s」导入失败: %w", i+1, req.ArticleTitle, err))
			continue
		}
		imported++
	}
	if len(errs) > 0 {
		return imported, errors.Join(errs...)
	}
	return imported, nil
}
