package service

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

// batchLoadArticleTags 批量加载文章 ID → 标签列表映射
// 消除 per-article N+1：一次 IN 查询拉回所有关联，再在 Go 侧按 article_id 分组。
type articleTagRow struct {
	ArticleID int    `gorm:"column:article_id"`
	ID        int    `gorm:"column:id"`
	TagName   string `gorm:"column:tag_name"`
}

func batchLoadArticleTags(ctx context.Context, db *gorm.DB, articleIDs []int) (map[int][]TagBrief, error) {
	result := make(map[int][]TagBrief)
	if len(articleIDs) == 0 {
		return result, nil
	}
	var rows []articleTagRow
	if err := db.WithContext(ctx).
		Table("tb_article_tag").
		Select("tb_article_tag.article_id, tb_tag.id, tb_tag.tag_name").
		Joins("JOIN tb_tag ON tb_article_tag.tag_id = tb_tag.id").
		Where("tb_article_tag.article_id IN ?", articleIDs).
		Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("批量查询文章标签失败: %w", err)
	}
	for _, r := range rows {
		result[r.ArticleID] = append(result[r.ArticleID], TagBrief{ID: r.ID, TagName: r.TagName})
	}
	return result, nil
}

// HomeArticleVO 首页文章卡片
type HomeArticleVO struct {
	ID             int        `json:"id"`
	ArticleCover   string     `json:"articleCover"`
	ArticleTitle   string     `json:"articleTitle"`
	ArticleContent string     `json:"articleContent"` // 截取摘要
	IsTop          bool       `json:"isTop"`
	Type           int        `json:"type"`
	Status         int        `json:"status"`
	CreateTime     string     `json:"createTime"`
	CategoryID     *int       `json:"categoryId"`
	CategoryName   string     `json:"categoryName"`
	TagVOList      []TagBrief `json:"tagVOList" gorm:"-"`
}

// TagBrief 标签简要信息
type TagBrief struct {
	ID      int    `json:"id"`
	TagName string `json:"tagName"`
}

// ArchiveVO 归档文章
type ArchiveVO struct {
	ID           int    `json:"id"`
	ArticleTitle string `json:"articleTitle"`
	CreateTime   string `json:"createTime"`
}

// ListHomeArticles 首页文章列表
func (s *ArticleService) ListHomeArticles(ctx context.Context, page, size int) (*repository.PageResult[HomeArticleVO], error) {
	var articles []HomeArticleVO
	var count int64

	db := s.db.WithContext(ctx).
		Table("tb_article").
		Select(`tb_article.id, tb_article.article_cover, tb_article.article_title,
			SUBSTRING(tb_article.article_content, 1, 500) as article_content,
			tb_article.is_top, tb_article.type, tb_article.status,
			TO_CHAR(tb_article.create_time, 'YYYY-MM-DD') as create_time,
			tb_article.category_id, tb_category.category_name`).
		Joins("LEFT JOIN tb_category ON tb_article.category_id = tb_category.id").
		Where("tb_article.is_delete = false AND tb_article.status = 1")

	db.Count(&count)

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).
		Order("tb_article.is_top DESC, tb_article.id DESC").
		Find(&articles).Error; err != nil {
		return nil, fmt.Errorf("查询首页文章失败: %w", err)
	}

	// 批量填充标签，消除 N+1
	ids := make([]int, 0, len(articles))
	for _, a := range articles {
		ids = append(ids, a.ID)
	}
	tagMap, err := batchLoadArticleTags(ctx, s.db, ids)
	if err != nil {
		return nil, err
	}
	for i := range articles {
		articles[i].TagVOList = tagMap[articles[i].ID]
	}

	return &repository.PageResult[HomeArticleVO]{
		Records: articles,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// ListArchives 归档列表
func (s *ArticleService) ListArchives(ctx context.Context, page, size int) (*repository.PageResult[ArchiveVO], error) {
	var archives []ArchiveVO
	var count int64

	db := s.db.WithContext(ctx).
		Table("tb_article").
		Where("is_delete = false AND status = 1")

	db.Count(&count)

	offset := (page - 1) * size
	if err := db.
		Select("id, article_title, TO_CHAR(create_time, 'YYYY-MM-DD') as create_time").
		Offset(offset).Limit(size).
		Order("id DESC").
		Find(&archives).Error; err != nil {
		return nil, fmt.Errorf("查询归档失败: %w", err)
	}

	return &repository.PageResult[ArchiveVO]{
		Records: archives,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// ListByCondition 条件查询（按分类或标签）
func (s *ArticleService) ListByCondition(ctx context.Context, page, size int, categoryID, tagID *int) (*repository.PageResult[HomeArticleVO], error) {
	var articles []HomeArticleVO
	var count int64

	db := s.db.WithContext(ctx).
		Table("tb_article").
		Select(`tb_article.id, tb_article.article_cover, tb_article.article_title,
			SUBSTRING(tb_article.article_content, 1, 500) as article_content,
			tb_article.is_top, tb_article.type, tb_article.status,
			TO_CHAR(tb_article.create_time, 'YYYY-MM-DD') as create_time,
			tb_article.category_id, tb_category.category_name`).
		Joins("LEFT JOIN tb_category ON tb_article.category_id = tb_category.id").
		Where("tb_article.is_delete = false AND tb_article.status = 1")

	if categoryID != nil {
		db = db.Where("tb_article.category_id = ?", *categoryID)
	}
	if tagID != nil {
		db = db.Joins("JOIN tb_article_tag ON tb_article.id = tb_article_tag.article_id").
			Where("tb_article_tag.tag_id = ?", *tagID)
	}

	db.Count(&count)

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).
		Order("tb_article.id DESC").
		Find(&articles).Error; err != nil {
		return nil, fmt.Errorf("条件查询文章失败: %w", err)
	}

	// 批量填充标签，消除 N+1
	ids := make([]int, 0, len(articles))
	for _, a := range articles {
		ids = append(ids, a.ID)
	}
	tagMap, err := batchLoadArticleTags(ctx, s.db, ids)
	if err != nil {
		return nil, err
	}
	for i := range articles {
		articles[i].TagVOList = tagMap[articles[i].ID]
	}

	return &repository.PageResult[HomeArticleVO]{
		Records: articles,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}
