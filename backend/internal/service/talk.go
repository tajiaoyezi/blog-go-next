package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

const (
	talkLikeCountKey = "talk_like_count"
	userTalkLikeKey  = "user_talk_like:%d"
)

type TalkService struct {
	repo *repository.BaseRepository[model.Talk]
	db   *gorm.DB
	rdb  *redis.Client
}

func NewTalkService(db *gorm.DB, rdb *redis.Client) *TalkService {
	return &TalkService{
		repo: repository.NewBaseRepository[model.Talk](db),
		db:   db,
		rdb:  rdb,
	}
}

// TalkVO 说说视图对象
type TalkVO struct {
	ID         int      `json:"id"`
	Nickname   string   `json:"nickname"`
	Avatar     string   `json:"avatar"`
	Content    string   `json:"content"`
	ImageList  []string `json:"imgList"`
	IsTop      bool     `json:"isTop"`
	LikeCount  int64    `json:"likeCount"`
	CreateTime string   `json:"createTime"`
}

// ListTalks 前台说说列表
func (s *TalkService) ListTalks(ctx context.Context, page, size int) (*repository.PageResult[TalkVO], error) {
	var talks []TalkVO
	var count int64

	db := s.db.WithContext(ctx).
		Table("tb_talk").
		Select(`tb_talk.id, tb_user_info.nickname, tb_user_info.avatar,
			tb_talk.content, tb_talk.images, tb_talk.is_top,
			TO_CHAR(tb_talk.create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time`).
		Joins("JOIN tb_user_info ON tb_talk.user_id = tb_user_info.id").
		Where("tb_talk.status = 1")

	db.Count(&count)

	offset := (page - 1) * size
	type talkRow struct {
		ID         int    `json:"id"`
		Nickname   string `json:"nickname"`
		Avatar     string `json:"avatar"`
		Content    string `json:"content"`
		Images     string `json:"images"`
		IsTop      bool   `json:"isTop"`
		CreateTime string `json:"createTime"`
	}
	var rows []talkRow
	if err := db.Offset(offset).Limit(size).Order("tb_talk.is_top DESC, tb_talk.id DESC").Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("查询说说失败: %w", err)
	}

	for _, row := range rows {
		var imgList []string
		if row.Images != "" {
			imgList = strings.Split(row.Images, ",")
		}
		likeCount, _ := s.rdb.HGet(ctx, talkLikeCountKey, strconv.Itoa(row.ID)).Int64()
		talks = append(talks, TalkVO{
			ID:         row.ID,
			Nickname:   row.Nickname,
			Avatar:     row.Avatar,
			Content:    row.Content,
			ImageList:  imgList,
			IsTop:      row.IsTop,
			LikeCount:  likeCount,
			CreateTime: row.CreateTime,
		})
	}

	return &repository.PageResult[TalkVO]{
		Records: talks,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// GetByID 获取说说详情
func (s *TalkService) GetByID(ctx context.Context, id int) (*TalkVO, error) {
	type talkRow struct {
		ID         int    `json:"id"`
		Nickname   string `json:"nickname"`
		Avatar     string `json:"avatar"`
		Content    string `json:"content"`
		Images     string `json:"images"`
		IsTop      bool   `json:"isTop"`
		CreateTime string `json:"createTime"`
	}
	var row talkRow
	if err := s.db.WithContext(ctx).
		Table("tb_talk").
		Select(`tb_talk.id, tb_user_info.nickname, tb_user_info.avatar,
			tb_talk.content, tb_talk.images, tb_talk.is_top,
			TO_CHAR(tb_talk.create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time`).
		Joins("JOIN tb_user_info ON tb_talk.user_id = tb_user_info.id").
		Where("tb_talk.id = ?", id).
		First(&row).Error; err != nil {
		return nil, fmt.Errorf("说说不存在")
	}

	var imgList []string
	if row.Images != "" {
		imgList = strings.Split(row.Images, ",")
	}
	likeCount, _ := s.rdb.HGet(ctx, talkLikeCountKey, strconv.Itoa(row.ID)).Int64()

	return &TalkVO{
		ID:         row.ID,
		Nickname:   row.Nickname,
		Avatar:     row.Avatar,
		Content:    row.Content,
		ImageList:  imgList,
		IsTop:      row.IsTop,
		LikeCount:  likeCount,
		CreateTime: row.CreateTime,
	}, nil
}

// SaveOrUpdate 新增/更新说说
func (s *TalkService) SaveOrUpdate(ctx context.Context, talk *model.Talk) error {
	if talk.ID > 0 {
		return s.repo.Update(ctx, talk.ID, map[string]interface{}{
			"content": talk.Content,
			"images":  talk.Images,
			"is_top":  talk.IsTop,
			"status":  talk.Status,
		})
	}
	return s.repo.Create(ctx, talk)
}

// Delete 删除说说
func (s *TalkService) Delete(ctx context.Context, ids []int) error {
	return s.repo.Delete(ctx, ids)
}

// LikeTalk 点赞/取消点赞说说（Lua 脚本原子切换）
func (s *TalkService) LikeTalk(ctx context.Context, userID, talkID int) (bool, error) {
	userKey := fmt.Sprintf(userTalkLikeKey, userID)
	talkIDStr := strconv.Itoa(talkID)

	res, err := toggleLikeScript.Run(ctx, s.rdb,
		[]string{userKey, talkLikeCountKey},
		talkIDStr,
	).Int64()
	if err != nil {
		return false, fmt.Errorf("切换点赞状态失败: %w", err)
	}
	return res == 1, nil
}

// ListAdminTalks 后台说说列表
func (s *TalkService) ListAdminTalks(ctx context.Context, page, size int, status *int) (*repository.PageResult[model.Talk], error) {
	return s.repo.List(ctx, page, size, func(db *gorm.DB) *gorm.DB {
		if status != nil {
			db = db.Where("status = ?", *status)
		}
		return db.Order("id DESC")
	})
}
