package service

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

const (
	commentLikeCountKey = "comment_like_count"
	userCommentLikeKey  = "user_comment_like:%d"
)

type CommentService struct {
	repo *repository.BaseRepository[model.Comment]
	db   *gorm.DB
	rdb  *redis.Client
}

func NewCommentService(db *gorm.DB, rdb *redis.Client) *CommentService {
	return &CommentService{
		repo: repository.NewBaseRepository[model.Comment](db),
		db:   db,
		rdb:  rdb,
	}
}

// CommentVO 评论视图对象（含子回复）
type CommentVO struct {
	ID             int         `json:"id"`
	UserID         int         `json:"userId"`
	Nickname       string      `json:"nickname"`
	Avatar         string      `json:"avatar"`
	CommentContent string      `json:"commentContent"`
	LikeCount      int64       `json:"likeCount"`
	CreateTime     string      `json:"createTime"`
	ReplyCount     int64       `json:"replyCount"`
	ReplyVOList    []ReplyVO   `json:"replyVOList"`
}

// ReplyVO 回复视图对象
type ReplyVO struct {
	ID             int    `json:"id"`
	ParentID       int    `json:"parentId"`
	UserID         int    `json:"userId"`
	Nickname       string `json:"nickname"`
	Avatar         string `json:"avatar"`
	ReplyUserID    *int   `json:"replyUserId"`
	ReplyNickname  string `json:"replyNickname"`
	CommentContent string `json:"commentContent"`
	LikeCount      int64  `json:"likeCount"`
	CreateTime     string `json:"createTime"`
}

// ListComments 获取评论列表（树形结构）
// 先分页拿顶级评论，再用两条 IN 查询一次性拉回所有子回复与回复总数，
// 避免 per-root N+1。子回复查询显式带上 topic_id 与 type，防止不同
// 主题/不同评论类型之间的评论被串起来。
func (s *CommentService) ListComments(ctx context.Context, topicID *int, commentType, page, size int) (*repository.PageResult[CommentVO], error) {
	var comments []CommentVO
	var count int64

	// 1. 查询顶级评论
	db := s.db.WithContext(ctx).
		Table("tb_comment c").
		Select(`c.id, c.user_id, u.nickname, u.avatar, c.comment_content,
			TO_CHAR(c.create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time`).
		Joins("JOIN tb_user_info u ON c.user_id = u.id").
		Where("c.parent_id IS NULL AND c.type = ? AND c.is_delete = false AND c.is_review = true", commentType)

	if topicID != nil {
		db = db.Where("c.topic_id = ?", *topicID)
	} else {
		db = db.Where("c.topic_id IS NULL")
	}

	if err := db.Count(&count).Error; err != nil {
		return nil, fmt.Errorf("统计评论数失败: %w", err)
	}

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Order("c.id DESC").Find(&comments).Error; err != nil {
		return nil, fmt.Errorf("查询评论失败: %w", err)
	}

	if len(comments) == 0 {
		return &repository.PageResult[CommentVO]{
			Records: comments,
			Count:   count,
			Current: page,
			Size:    size,
		}, nil
	}

	rootIDs := make([]int, 0, len(comments))
	for _, c := range comments {
		rootIDs = append(rootIDs, c.ID)
	}

	// 2. 批量查所有子回复（带 topic_id + type 防串扰）
	type replyRow struct {
		ReplyVO
	}
	var allReplies []replyRow
	repliesQuery := s.db.WithContext(ctx).
		Table("tb_comment c").
		Select(`c.id, c.parent_id, c.user_id, u.nickname, u.avatar,
			c.reply_user_id, ru.nickname as reply_nickname,
			c.comment_content,
			TO_CHAR(c.create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time`).
		Joins("JOIN tb_user_info u ON c.user_id = u.id").
		Joins("LEFT JOIN tb_user_info ru ON c.reply_user_id = ru.id").
		Where("c.parent_id IN ? AND c.type = ? AND c.is_delete = false AND c.is_review = true",
			rootIDs, commentType)
	if topicID != nil {
		repliesQuery = repliesQuery.Where("c.topic_id = ?", *topicID)
	} else {
		repliesQuery = repliesQuery.Where("c.topic_id IS NULL")
	}
	if err := repliesQuery.Order("c.id ASC").Find(&allReplies).Error; err != nil {
		return nil, fmt.Errorf("查询子回复失败: %w", err)
	}

	// 按 parent_id 分组，每组取前 3 条（展示）
	grouped := make(map[int][]ReplyVO, len(rootIDs))
	for _, r := range allReplies {
		grouped[r.ParentID] = append(grouped[r.ParentID], r.ReplyVO)
	}

	// 3. 批量查回复总数
	type replyCount struct {
		ParentID int   `gorm:"column:parent_id"`
		Count    int64 `gorm:"column:count"`
	}
	var counts []replyCount
	countsQuery := s.db.WithContext(ctx).
		Model(&model.Comment{}).
		Select("parent_id, COUNT(*) as count").
		Where("parent_id IN ? AND type = ? AND is_delete = false AND is_review = true",
			rootIDs, commentType)
	if topicID != nil {
		countsQuery = countsQuery.Where("topic_id = ?", *topicID)
	} else {
		countsQuery = countsQuery.Where("topic_id IS NULL")
	}
	if err := countsQuery.Group("parent_id").Find(&counts).Error; err != nil {
		return nil, fmt.Errorf("统计回复数失败: %w", err)
	}
	countMap := make(map[int]int64, len(counts))
	for _, c := range counts {
		countMap[c.ParentID] = c.Count
	}

	// 4. 回填顶级评论
	for i := range comments {
		replies := grouped[comments[i].ID]
		if len(replies) > 3 {
			replies = replies[:3]
		}
		comments[i].ReplyVOList = replies
		comments[i].ReplyCount = countMap[comments[i].ID]
	}

	return &repository.PageResult[CommentVO]{
		Records: comments,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// Create 发表评论
// 若带 parent_id，必须校验父评论的 topic_id / type 与当前请求一致，
// 否则可能把某篇文章的回复挂到另一篇文章、甚至另一个主题类型下。
func (s *CommentService) Create(ctx context.Context, comment *model.Comment) error {
	if comment.ParentID != nil {
		var parent model.Comment
		if err := s.db.WithContext(ctx).First(&parent, *comment.ParentID).Error; err != nil {
			return fmt.Errorf("父评论不存在")
		}
		if parent.IsDelete {
			return fmt.Errorf("父评论已被删除，无法回复")
		}
		if parent.Type != comment.Type {
			return fmt.Errorf("父评论类型不匹配")
		}
		if !samePtr(parent.TopicID, comment.TopicID) {
			return fmt.Errorf("父评论所在主题不匹配")
		}
	}
	return s.repo.Create(ctx, comment)
}

// samePtr 比较两个 *int 指针值是否等价（都 nil 或指向相同值）
func samePtr(a, b *int) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

type AdminCommentVO struct {
	ID             int    `json:"id"`
	Nickname       string `json:"nickname"`
	Avatar         string `json:"avatar"`
	CommentContent string `json:"commentContent"`
	ArticleTitle   string `json:"articleTitle"`
	IsReview       bool   `json:"isReview"`
	CreateTime     string `json:"createTime"`
}

// ListAdminComments 后台评论列表
func (s *CommentService) ListAdminComments(ctx context.Context, page, size int, commentType *int, isReview *bool, keyword string) (*repository.PageResult[AdminCommentVO], error) {
	type adminCommentResult struct {
		ID             int    `gorm:"column:id"`
		Nickname       string `gorm:"column:nickname"`
		Avatar         string `gorm:"column:avatar"`
		CommentContent string `gorm:"column:comment_content"`
		ArticleTitle   string `gorm:"column:article_title"`
		IsReview       bool   `gorm:"column:is_review"`
		CreateTime     string `gorm:"column:create_time"`
	}

	var total int64
	db := s.db.WithContext(ctx).Table("tb_comment c").
		Select("c.id, COALESCE(ui.nickname, '') as nickname, COALESCE(ui.avatar, '') as avatar, c.comment_content, COALESCE(a.article_title, '') as article_title, c.is_review, TO_CHAR(c.create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time").
		Joins("LEFT JOIN tb_user_info ui ON c.user_id = ui.id").
		Joins("LEFT JOIN tb_article a ON c.topic_id = a.id AND c.type = 1").
		Where("c.is_delete = false")

	if commentType != nil {
		db = db.Where("c.type = ?", *commentType)
	}
	if isReview != nil {
		db = db.Where("c.is_review = ?", *isReview)
	}
	if keyword != "" {
		db = db.Where("c.comment_content LIKE ?", "%"+keyword+"%")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var results []adminCommentResult
	offset := (page - 1) * size
	if err := db.Order("c.id DESC").Limit(size).Offset(offset).Find(&results).Error; err != nil {
		return nil, err
	}

	records := make([]AdminCommentVO, len(results))
	for i, r := range results {
		records[i] = AdminCommentVO{
			ID:             r.ID,
			Nickname:       r.Nickname,
			Avatar:         r.Avatar,
			CommentContent: r.CommentContent,
			ArticleTitle:   r.ArticleTitle,
			IsReview:       r.IsReview,
			CreateTime:     r.CreateTime,
		}
	}

	return &repository.PageResult[AdminCommentVO]{
		Records: records,
		Count:   total,
		Current: page,
		Size:    size,
	}, nil
}

// Review 审核评论
func (s *CommentService) Review(ctx context.Context, ids []int, isReview bool) error {
	return s.db.WithContext(ctx).Model(&model.Comment{}).Where("id IN ?", ids).Update("is_review", isReview).Error
}

// Delete 删除评论
func (s *CommentService) Delete(ctx context.Context, ids []int) error {
	return s.db.WithContext(ctx).Model(&model.Comment{}).Where("id IN ?", ids).Update("is_delete", true).Error
}
