package service

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

type ArticleService struct {
	repo *repository.BaseRepository[model.Article]
	db   *gorm.DB
}

func NewArticleService(db *gorm.DB) *ArticleService {
	return &ArticleService{
		repo: repository.NewBaseRepository[model.Article](db),
		db:   db,
	}
}

// SaveArticleRequest 新增/更新文章请求
type SaveArticleRequest struct {
	ID             int      `json:"id"`
	ArticleTitle   string   `json:"articleTitle" binding:"required"`
	ArticleContent string   `json:"articleContent" binding:"required"`
	ArticleCover   string   `json:"articleCover"`
	CategoryName   string   `json:"categoryName"`
	TagNameList    []string `json:"tagNameList"`
	Type           int      `json:"type"`
	OriginalURL    string   `json:"originalUrl"`
	IsTop          bool     `json:"isTop"`
	Status         int      `json:"status"`
}

// AdminArticleVO 后台文章视图
type AdminArticleVO struct {
	model.Article
	CategoryName string   `json:"categoryName"`
	TagNameList  []string `json:"tagNameList"`
}

// SaveOrUpdate 新增或更新文章
// 更新分支只修改允许字段（title/content/cover/category/type/original_url/is_top/status），
// create_time、user_id、is_delete 由系统控制，不接受请求体覆盖。
func (s *ArticleService) SaveOrUpdate(ctx context.Context, req SaveArticleRequest, userID int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 处理分类：按名称查找或创建
		var categoryID *int
		if req.CategoryName != "" {
			var category model.Category
			result := tx.Where("category_name = ?", req.CategoryName).First(&category)
			if result.Error != nil {
				// 分类不存在，自动创建
				category = model.Category{
					BaseModel:    model.BaseModel{CreateTime: time.Now()},
					CategoryName: req.CategoryName,
				}
				if err := tx.Create(&category).Error; err != nil {
					return fmt.Errorf("创建分类失败: %w", err)
				}
			}
			categoryID = &category.ID
		}

		var articleID int
		if req.ID > 0 {
			// 更新：先确认文章存在，再仅更新允许字段
			var existing model.Article
			if err := tx.First(&existing, req.ID).Error; err != nil {
				return fmt.Errorf("文章不存在")
			}
			updates := map[string]interface{}{
				"article_title":   req.ArticleTitle,
				"article_content": req.ArticleContent,
				"article_cover":   req.ArticleCover,
				"category_id":     categoryID,
				"type":            req.Type,
				"original_url":    req.OriginalURL,
				"is_top":          req.IsTop,
				"status":          req.Status,
			}
			if err := tx.Model(&existing).Updates(updates).Error; err != nil {
				return fmt.Errorf("更新文章失败: %w", err)
			}
			articleID = existing.ID
			// 删除旧标签关联
			if err := tx.Where("article_id = ?", articleID).Delete(&model.ArticleTag{}).Error; err != nil {
				return fmt.Errorf("清理旧标签关联失败: %w", err)
			}
		} else {
			// 新增
			article := model.Article{
				BaseModel:      model.BaseModel{CreateTime: time.Now()},
				UserID:         userID,
				CategoryID:     categoryID,
				ArticleTitle:   req.ArticleTitle,
				ArticleContent: req.ArticleContent,
				ArticleCover:   req.ArticleCover,
				Type:           req.Type,
				OriginalURL:    req.OriginalURL,
				IsTop:          req.IsTop,
				Status:         req.Status,
			}
			if err := tx.Create(&article).Error; err != nil {
				return fmt.Errorf("创建文章失败: %w", err)
			}
			articleID = article.ID
		}

		// 处理标签：按名称查找或创建，建立关联
		for _, tagName := range req.TagNameList {
			var tag model.Tag
			result := tx.Where("tag_name = ?", tagName).First(&tag)
			if result.Error != nil {
				tag = model.Tag{
					BaseModel: model.BaseModel{CreateTime: time.Now()},
					TagName:   tagName,
				}
				if err := tx.Create(&tag).Error; err != nil {
					return fmt.Errorf("创建标签失败: %w", err)
				}
			}
			if err := tx.Create(&model.ArticleTag{ArticleID: articleID, TagID: tag.ID}).Error; err != nil {
				return fmt.Errorf("创建标签关联失败: %w", err)
			}
		}

		return nil
	})
}

// GetByID 后台获取文章详情（不做可见性过滤，可读出草稿与软删文章）
func (s *ArticleService) GetByID(ctx context.Context, id int) (*model.Article, error) {
	var article model.Article
	if err := s.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		First(&article, id).Error; err != nil {
		return nil, fmt.Errorf("文章不存在")
	}
	return &article, nil
}

// GetPublicByID 公开接口获取文章详情
// 必须显式过滤 is_delete=false 且 status=1（公开），否则公开 URL 可以拉到
// 私密 / 评论可见 / 已软删的文章。
func (s *ArticleService) GetPublicByID(ctx context.Context, id int) (*model.Article, error) {
	var article model.Article
	if err := s.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		Where("is_delete = ? AND status = ?", false, 1).
		First(&article, id).Error; err != nil {
		return nil, fmt.Errorf("文章不存在")
	}
	return &article, nil
}

// ListAdminArticles 后台文章列表
func (s *ArticleService) ListAdminArticles(ctx context.Context, page, size int, keyword string, status, categoryID, articleType *int, isDelete *bool) (*repository.PageResult[AdminArticleVO], error) {
	var articles []AdminArticleVO
	var count int64

	db := s.db.WithContext(ctx).
		Table("tb_article").
		Select("tb_article.*, tb_category.category_name").
		Joins("LEFT JOIN tb_category ON tb_article.category_id = tb_category.id")

	if keyword != "" {
		db = db.Where("tb_article.article_title LIKE ?", "%"+keyword+"%")
	}
	if status != nil {
		db = db.Where("tb_article.status = ?", *status)
	}
	if categoryID != nil {
		db = db.Where("tb_article.category_id = ?", *categoryID)
	}
	if articleType != nil {
		db = db.Where("tb_article.type = ?", *articleType)
	}
	if isDelete != nil {
		db = db.Where("tb_article.is_delete = ?", *isDelete)
	} else {
		db = db.Where("tb_article.is_delete = false")
	}

	db.Count(&count)

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Order("tb_article.is_top DESC, tb_article.id DESC").Find(&articles).Error; err != nil {
		return nil, fmt.Errorf("查询文章失败: %w", err)
	}

	// 批量填充标签名，消除 N+1
	ids := make([]int, 0, len(articles))
	for _, a := range articles {
		ids = append(ids, a.ID)
	}
	tagMap, err := batchLoadArticleTags(ctx, s.db, ids)
	if err != nil {
		return nil, err
	}
	for i := range articles {
		brief := tagMap[articles[i].ID]
		names := make([]string, 0, len(brief))
		for _, t := range brief {
			names = append(names, t.TagName)
		}
		articles[i].TagNameList = names
	}

	return &repository.PageResult[AdminArticleVO]{
		Records: articles,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// ToggleTop 切换文章置顶
func (s *ArticleService) ToggleTop(ctx context.Context, id int, isTop bool) error {
	return s.db.WithContext(ctx).Model(&model.Article{}).Where("id = ?", id).Update("is_top", isTop).Error
}

// SoftDelete 逻辑删除/恢复文章
func (s *ArticleService) SoftDelete(ctx context.Context, ids []int, isDelete bool) error {
	return s.db.WithContext(ctx).Model(&model.Article{}).Where("id IN ?", ids).Update("is_delete", isDelete).Error
}

// HardDelete 物理删除文章
func (s *ArticleService) HardDelete(ctx context.Context, ids []int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("article_id IN ?", ids).Delete(&model.ArticleTag{}).Error; err != nil {
			return fmt.Errorf("删除标签关联失败: %w", err)
		}
		if err := tx.Where("id IN ?", ids).Delete(&model.Article{}).Error; err != nil {
			return fmt.Errorf("删除文章失败: %w", err)
		}
		return nil
	})
}
