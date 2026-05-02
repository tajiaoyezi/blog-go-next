package service

import (
	"context"
	"fmt"
	"strconv"

	"github.com/redis/go-redis/v9"
)

const (
	articleLikeCountKey = "article_like_count"   // Hash: articleId -> count
	articleViewCountKey = "article_view_count"   // Hash: articleId -> count
	userArticleLikeKey  = "user_article_like:%d" // Set: 用户点赞过的文章 ID
)

// toggleLikeScript 原子切换点赞状态
// KEYS[1]=用户点赞 Set, KEYS[2]=文章点赞计数 Hash
// ARGV[1]=articleID
// 返回 1 表示此次变为点赞，返回 0 表示此次变为取消点赞。
var toggleLikeScript = redis.NewScript(`
local exist = redis.call('SISMEMBER', KEYS[1], ARGV[1])
if exist == 1 then
  redis.call('SREM', KEYS[1], ARGV[1])
  redis.call('HINCRBY', KEYS[2], ARGV[1], -1)
  return 0
else
  redis.call('SADD', KEYS[1], ARGV[1])
  redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
  return 1
end
`)

// ArticleStatsService 文章统计服务
type ArticleStatsService struct {
	RDB *redis.Client
}

func NewArticleStatsService(rdb *redis.Client) *ArticleStatsService {
	return &ArticleStatsService{RDB: rdb}
}

// LikeArticle 文章点赞/取消点赞（Lua 脚本原子切换）
// 返回操作后当前是否处于已点赞状态，供前端刷新按钮态。
func (s *ArticleStatsService) LikeArticle(ctx context.Context, userID, articleID int) (bool, error) {
	userKey := fmt.Sprintf(userArticleLikeKey, userID)
	articleIDStr := strconv.Itoa(articleID)

	res, err := toggleLikeScript.Run(ctx, s.RDB,
		[]string{userKey, articleLikeCountKey},
		articleIDStr,
	).Int64()
	if err != nil {
		return false, fmt.Errorf("切换点赞状态失败: %w", err)
	}
	return res == 1, nil
}

// GetLikeCount 获取文章点赞数
func (s *ArticleStatsService) GetLikeCount(ctx context.Context, articleID int) (int64, error) {
	count, err := s.RDB.HGet(ctx, articleLikeCountKey, strconv.Itoa(articleID)).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrViewCount 增加文章浏览量
func (s *ArticleStatsService) IncrViewCount(ctx context.Context, articleID int) error {
	return s.RDB.HIncrBy(ctx, articleViewCountKey, strconv.Itoa(articleID), 1).Err()
}

// GetViewCount 获取文章浏览量
func (s *ArticleStatsService) GetViewCount(ctx context.Context, articleID int) (int64, error) {
	count, err := s.RDB.HGet(ctx, articleViewCountKey, strconv.Itoa(articleID)).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IsLiked 检查用户是否已点赞
func (s *ArticleStatsService) IsLiked(ctx context.Context, userID, articleID int) bool {
	isMember, _ := s.RDB.SIsMember(ctx, fmt.Sprintf(userArticleLikeKey, userID), strconv.Itoa(articleID)).Result()
	return isMember
}
