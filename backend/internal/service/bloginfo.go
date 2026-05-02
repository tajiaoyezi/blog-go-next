package service

import (
	"context"
	"encoding/json"
	"fmt"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

type BlogInfoService struct {
	db *gorm.DB
}

func NewBlogInfoService(db *gorm.DB) *BlogInfoService {
	return &BlogInfoService{db: db}
}

// AdminDashboard 后台仪表盘数据
type AdminDashboard struct {
	ArticleCount  int64            `json:"articleCount"`
	UserCount     int64            `json:"userCount"`
	MessageCount  int64            `json:"messageCount"`
	ViewCount     int64            `json:"viewCount"`
	CategoryList  []CategoryCount  `json:"categoryList"`
	TagList       []TagCount       `json:"tagDTOList"`
	ArticleStats  []ArticleStat    `json:"articleStatisticsList"`
	UniqueViews   []UniqueViewStat `json:"viewList"`
}

type CategoryCount struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type TagCount struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type ArticleStat struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type UniqueViewStat struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// GetDashboard 获取后台仪表盘数据
func (s *BlogInfoService) GetDashboard(ctx context.Context) (*AdminDashboard, error) {
	var dashboard AdminDashboard

	if err := s.db.WithContext(ctx).Model(&model.Article{}).Where("is_delete = false").Count(&dashboard.ArticleCount).Error; err != nil {
		return nil, fmt.Errorf("统计文章数失败: %w", err)
	}
	if err := s.db.WithContext(ctx).Model(&model.UserAuth{}).Count(&dashboard.UserCount).Error; err != nil {
		return nil, fmt.Errorf("统计用户数失败: %w", err)
	}
	if err := s.db.WithContext(ctx).Model(&model.Message{}).Count(&dashboard.MessageCount).Error; err != nil {
		return nil, fmt.Errorf("统计留言数失败: %w", err)
	}

	// 总访问量
	if err := s.db.WithContext(ctx).Model(&model.UniqueView{}).Select("COALESCE(SUM(views_count), 0)").Scan(&dashboard.ViewCount).Error; err != nil {
		return nil, fmt.Errorf("统计总访问量失败: %w", err)
	}

	// 分类文章数统计
	if err := s.db.WithContext(ctx).
		Model(&model.Category{}).
		Select("tb_category.category_name as name, COUNT(tb_article.id) as value").
		Joins("LEFT JOIN tb_article ON tb_category.id = tb_article.category_id AND tb_article.is_delete = false").
		Group("tb_category.id, tb_category.category_name").
		Find(&dashboard.CategoryList).Error; err != nil {
		return nil, fmt.Errorf("统计分类文章数失败: %w", err)
	}

	// 标签文章数统计
	if err := s.db.WithContext(ctx).
		Model(&model.Tag{}).
		Select("tb_tag.tag_name as name, COUNT(tb_article_tag.article_id) as value").
		Joins("LEFT JOIN tb_article_tag ON tb_tag.id = tb_article_tag.tag_id").
		Group("tb_tag.id, tb_tag.tag_name").
		Find(&dashboard.TagList).Error; err != nil {
		return nil, fmt.Errorf("统计标签文章数失败: %w", err)
	}

	// 最近 7 天文章发布统计
	if err := s.db.WithContext(ctx).Raw(`
		SELECT TO_CHAR(d.date, 'YYYY-MM-DD') as date, COALESCE(COUNT(a.id), 0) as count
		FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d(date)
		LEFT JOIN tb_article a ON DATE(a.create_time) = d.date AND a.is_delete = false
		GROUP BY d.date ORDER BY d.date
	`).Scan(&dashboard.ArticleStats).Error; err != nil {
		return nil, fmt.Errorf("统计最近发布失败: %w", err)
	}

	// 最近 7 天独立访客统计
	if err := s.db.WithContext(ctx).Raw(`
		SELECT TO_CHAR(d.date, 'YYYY-MM-DD') as date, COALESCE(uv.views_count, 0) as count
		FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d(date)
		LEFT JOIN tb_unique_view uv ON DATE(uv.create_time) = d.date
		ORDER BY d.date
	`).Scan(&dashboard.UniqueViews).Error; err != nil {
		return nil, fmt.Errorf("统计独立访客失败: %w", err)
	}

	return &dashboard, nil
}

// GetWebsiteConfig 获取站点配置
func (s *BlogInfoService) GetWebsiteConfig(ctx context.Context) (string, error) {
	var config model.WebsiteConfig
	if err := s.db.WithContext(ctx).First(&config).Error; err != nil {
		return "{}", nil
	}
	return config.Config, nil
}

// UpdateWebsiteConfig 更新站点配置
func (s *BlogInfoService) UpdateWebsiteConfig(ctx context.Context, configJSON string) error {
	var config model.WebsiteConfig
	result := s.db.WithContext(ctx).First(&config)
	if result.Error != nil {
		// 不存在则创建
		config.Config = configJSON
		return s.db.WithContext(ctx).Create(&config).Error
	}
	return s.db.WithContext(ctx).Model(&config).Update("config", configJSON).Error
}

// UpdateAbout 更新「关于我」内容
// 不再直接覆盖整份站点配置；而是读取现有 JSON，合并 aboutContent 字段后写回。
// 如果旧数据不是合法 JSON（历史数据为空、或上一个版本误写），降级为仅含 aboutContent 的全新 JSON。
func (s *BlogInfoService) UpdateAbout(ctx context.Context, aboutContent string) error {
	current, err := s.GetWebsiteConfig(ctx)
	if err != nil {
		return fmt.Errorf("读取站点配置失败: %w", err)
	}

	var configMap map[string]interface{}
	if parseErr := json.Unmarshal([]byte(current), &configMap); parseErr != nil || configMap == nil {
		// 旧数据不是合法 JSON，降级为新对象
		configMap = map[string]interface{}{}
	}
	configMap["aboutContent"] = aboutContent

	merged, err := json.Marshal(configMap)
	if err != nil {
		return fmt.Errorf("序列化站点配置失败: %w", err)
	}
	return s.UpdateWebsiteConfig(ctx, string(merged))
}

// GetUserArea 用户地域分布
func (s *BlogInfoService) GetUserArea(ctx context.Context, areaType int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := s.db.WithContext(ctx).Model(&model.UserAuth{})

	if areaType == 1 {
		// 按用户注册地
		query.Select("ip_source as name, COUNT(*) as value").
			Where("ip_source != ''").
			Group("ip_source").
			Find(&results)
	} else {
		// 按登录地
		query.Select("ip_source as name, COUNT(*) as value").
			Where("ip_source != '' AND last_login_time IS NOT NULL").
			Group("ip_source").
			Find(&results)
	}

	if results == nil {
		return []map[string]interface{}{}, nil
	}
	return results, nil
}

// --- 操作日志 ---

type LogService struct {
	repo *repository.BaseRepository[model.OperationLog]
	db   *gorm.DB
}

func NewLogService(db *gorm.DB) *LogService {
	return &LogService{
		repo: repository.NewBaseRepository[model.OperationLog](db),
		db:   db,
	}
}

func (s *LogService) ListLogs(ctx context.Context, page, size int, keyword string) (*repository.PageResult[model.OperationLog], error) {
	return s.repo.List(ctx, page, size, func(db *gorm.DB) *gorm.DB {
		if keyword != "" {
			db = db.Where("opt_module LIKE ? OR opt_desc LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
		}
		return db.Order("id DESC")
	})
}

func (s *LogService) DeleteLogs(ctx context.Context, ids []int) error {
	if len(ids) == 0 {
		return fmt.Errorf("请提供要删除的日志 ID")
	}
	return s.repo.Delete(ctx, ids)
}
