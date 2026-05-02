package service

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

type CategoryService struct {
	repo *repository.BaseRepository[model.Category]
	db   *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{
		repo: repository.NewBaseRepository[model.Category](db),
		db:   db,
	}
}

// CategoryVO 分类视图对象（含文章数）
type CategoryVO struct {
	model.Category
	ArticleCount int64 `json:"articleCount"`
}

// ListCategories 前台：获取分类列表（含文章数）
func (s *CategoryService) ListCategories(ctx context.Context) ([]CategoryVO, error) {
	var categories []CategoryVO
	err := s.db.WithContext(ctx).
		Model(&model.Category{}).
		Select("tb_category.*, COUNT(tb_article.id) as article_count").
		Joins("LEFT JOIN tb_article ON tb_category.id = tb_article.category_id AND tb_article.is_delete = false AND tb_article.status = 1").
		Group("tb_category.id").
		Order("tb_category.id DESC").
		Find(&categories).Error
	if err != nil {
		return nil, fmt.Errorf("查询分类列表失败: %w", err)
	}
	return categories, nil
}

// ListAdminCategories 后台：分页查询分类
func (s *CategoryService) ListAdminCategories(ctx context.Context, page, size int, keyword string) (*repository.PageResult[CategoryVO], error) {
	var categories []CategoryVO
	var count int64

	db := s.db.WithContext(ctx).
		Model(&model.Category{}).
		Select("tb_category.*, COUNT(tb_article.id) as article_count").
		Joins("LEFT JOIN tb_article ON tb_category.id = tb_article.category_id AND tb_article.is_delete = false")

	if keyword != "" {
		db = db.Where("tb_category.category_name LIKE ?", "%"+keyword+"%")
	}

	db = db.Group("tb_category.id")
	db.Count(&count)

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Order("tb_category.id DESC").Find(&categories).Error; err != nil {
		return nil, fmt.Errorf("查询分类失败: %w", err)
	}

	return &repository.PageResult[CategoryVO]{
		Records: categories,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// SaveOrUpdate 新增或更新分类
func (s *CategoryService) SaveOrUpdate(ctx context.Context, category *model.Category) error {
	// 检查分类名是否重复
	var count int64
	query := s.db.WithContext(ctx).Model(&model.Category{}).Where("category_name = ?", category.CategoryName)
	if category.ID > 0 {
		query = query.Where("id != ?", category.ID)
	}
	query.Count(&count)
	if count > 0 {
		return fmt.Errorf("分类名已存在")
	}

	if category.ID > 0 {
		return s.repo.Update(ctx, category.ID, map[string]interface{}{
			"category_name": category.CategoryName,
		})
	}
	return s.repo.Create(ctx, category)
}

// Delete 删除分类（检查是否有文章关联）
func (s *CategoryService) Delete(ctx context.Context, ids []int) error {
	var count int64
	s.db.WithContext(ctx).Model(&model.Article{}).Where("category_id IN ?", ids).Count(&count)
	if count > 0 {
		return fmt.Errorf("该分类下存在文章，无法删除")
	}
	return s.repo.Delete(ctx, ids)
}

// SearchCategories 搜索分类（用于文章编辑时的下拉选择）
func (s *CategoryService) SearchCategories(ctx context.Context, keyword string) ([]model.Category, error) {
	return s.repo.FindAll(ctx, func(db *gorm.DB) *gorm.DB {
		if keyword != "" {
			return db.Where("category_name LIKE ?", "%"+keyword+"%")
		}
		return db
	})
}
