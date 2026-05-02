package service

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

// 公开留言列表分页大小限制
const (
	defaultMessagePageSize = 20
	maxMessagePageSize     = 100
)

// MessageVO 公开留言视图，移除 IP 相关字段
type MessageVO struct {
	ID             int    `json:"id"`
	Nickname       string `json:"nickname"`
	Avatar         string `json:"avatar"`
	MessageContent string `json:"messageContent"`
	Time           *int   `json:"time"`
	CreateTime     string `json:"createTime"`
}

type MessageService struct {
	repo *repository.BaseRepository[model.Message]
	db   *gorm.DB
}

func NewMessageService(db *gorm.DB) *MessageService {
	return &MessageService{
		repo: repository.NewBaseRepository[model.Message](db),
		db:   db,
	}
}

// ListMessages 前台获取留言列表（已审核）
// 分页，且仅暴露安全字段（不含 IPAddress / IPSource）。
func (s *MessageService) ListMessages(ctx context.Context, page, size int) (*repository.PageResult[MessageVO], error) {
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = defaultMessagePageSize
	}
	if size > maxMessagePageSize {
		size = maxMessagePageSize
	}

	var messages []MessageVO
	var count int64

	base := s.db.WithContext(ctx).
		Table("tb_message").
		Where("is_review = true")

	if err := base.Count(&count).Error; err != nil {
		return nil, fmt.Errorf("统计留言数失败: %w", err)
	}

	offset := (page - 1) * size
	if err := base.
		Select(`id, nickname, avatar, message_content,
			time,
			TO_CHAR(create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time`).
		Offset(offset).
		Limit(size).
		Order("id DESC").
		Find(&messages).Error; err != nil {
		return nil, fmt.Errorf("查询留言列表失败: %w", err)
	}

	return &repository.PageResult[MessageVO]{
		Records: messages,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// Create 提交留言
func (s *MessageService) Create(ctx context.Context, msg *model.Message) error {
	msg.IsReview = true // 默认通过审核
	return s.repo.Create(ctx, msg)
}

// ListAdminMessages 后台留言列表
func (s *MessageService) ListAdminMessages(ctx context.Context, page, size int, isReview *bool, keyword string) (*repository.PageResult[model.Message], error) {
	return s.repo.List(ctx, page, size, func(db *gorm.DB) *gorm.DB {
		if isReview != nil {
			db = db.Where("is_review = ?", *isReview)
		}
		if keyword != "" {
			db = db.Where("nickname LIKE ? OR message_content LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
		}
		return db.Order("id DESC")
	})
}

// Review 审核留言
func (s *MessageService) Review(ctx context.Context, ids []int, isReview bool) error {
	return s.db.WithContext(ctx).Model(&model.Message{}).Where("id IN ?", ids).Update("is_review", isReview).Error
}

// Delete 删除留言
func (s *MessageService) Delete(ctx context.Context, ids []int) error {
	return s.repo.Delete(ctx, ids)
}

// SubmitMessage 前台提交留言（含 IP 信息）
func (s *MessageService) SubmitMessage(ctx context.Context, nickname, avatar, content, ipAddress string) error {
	msg := &model.Message{
		Nickname:       nickname,
		Avatar:         avatar,
		MessageContent: content,
		IPAddress:      ipAddress,
		IsReview:       true,
	}
	if nickname == "" {
		return fmt.Errorf("请输入昵称")
	}
	if content == "" {
		return fmt.Errorf("请输入留言内容")
	}
	return s.repo.Create(ctx, msg)
}
