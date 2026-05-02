package service

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

type TagService struct {
	repo *repository.BaseRepository[model.Tag]
	db   *gorm.DB
}

func NewTagService(db *gorm.DB) *TagService {
	return &TagService{
		repo: repository.NewBaseRepository[model.Tag](db),
		db:   db,
	}
}

// TagVO 标签视图对象（含文章数）
type TagVO struct {
	model.Tag
	ArticleCount int64 `json:"articleCount"`
}

// ListTags 前台：获取标签列表（含公开文章数）
// 文章数 COUNT 需同时过滤软删与非公开，否则前端会看到 \"标签有 5 篇\"
// 但点进去只剩 2 篇的数据不一致。
func (s *TagService) ListTags(ctx context.Context) ([]TagVO, error) {
	var tags []TagVO
	err := s.db.WithContext(ctx).
		Model(&model.Tag{}).
		Select("tb_tag.*, COUNT(tb_article.id) as article_count").
		Joins("LEFT JOIN tb_article_tag ON tb_tag.id = tb_article_tag.tag_id").
		Joins("LEFT JOIN tb_article ON tb_article_tag.article_id = tb_article.id AND tb_article.is_delete = false AND tb_article.status = 1").
		Group("tb_tag.id").
		Order("tb_tag.id DESC").
		Find(&tags).Error
	if err != nil {
		return nil, fmt.Errorf("查询标签列表失败: %w", err)
	}
	return tags, nil
}

// ListAdminTags 后台：分页查询标签
// 后台也同样过滤软删文章，以保持一致；软删后的引用不应继续阻止管理员操作。
func (s *TagService) ListAdminTags(ctx context.Context, page, size int, keyword string) (*repository.PageResult[TagVO], error) {
	var tags []TagVO
	var count int64

	db := s.db.WithContext(ctx).
		Model(&model.Tag{}).
		Select("tb_tag.*, COUNT(tb_article.id) as article_count").
		Joins("LEFT JOIN tb_article_tag ON tb_tag.id = tb_article_tag.tag_id").
		Joins("LEFT JOIN tb_article ON tb_article_tag.article_id = tb_article.id AND tb_article.is_delete = false")

	if keyword != "" {
		db = db.Where("tb_tag.tag_name LIKE ?", "%"+keyword+"%")
	}

	db = db.Group("tb_tag.id")
	db.Count(&count)

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Order("tb_tag.id DESC").Find(&tags).Error; err != nil {
		return nil, fmt.Errorf("查询标签失败: %w", err)
	}

	return &repository.PageResult[TagVO]{
		Records: tags,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// SaveOrUpdate 新增或更新标签
func (s *TagService) SaveOrUpdate(ctx context.Context, tag *model.Tag) error {
	var count int64
	query := s.db.WithContext(ctx).Model(&model.Tag{}).Where("tag_name = ?", tag.TagName)
	if tag.ID > 0 {
		query = query.Where("id != ?", tag.ID)
	}
	query.Count(&count)
	if count > 0 {
		return fmt.Errorf("标签名已存在")
	}

	if tag.ID > 0 {
		return s.repo.Update(ctx, tag.ID, map[string]interface{}{
			"tag_name": tag.TagName,
		})
	}
	return s.repo.Create(ctx, tag)
}

// Delete 删除标签（检查是否有未软删文章关联）
// 已软删文章的关联不应阻止标签删除；真正在用的标签才需要保护。
func (s *TagService) Delete(ctx context.Context, ids []int) error {
	var count int64
	if err := s.db.WithContext(ctx).
		Table("tb_article_tag").
		Joins("JOIN tb_article ON tb_article_tag.article_id = tb_article.id AND tb_article.is_delete = false").
		Where("tb_article_tag.tag_id IN ?", ids).
		Count(&count).Error; err != nil {
		return fmt.Errorf("检查标签关联失败: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("该标签下存在文章，无法删除")
	}
	return s.repo.Delete(ctx, ids)
}
