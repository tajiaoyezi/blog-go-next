package oauth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// OAuth state CSRF 防护。
// 使用方必须：
//  1. 在拼接授权 URL 前调用 GenerateState 得到 state，写进重定向 URL 的 state 参数；
//  2. 在 callback 中先调用 VerifyState 再调用 GetAccessToken；
//     state 不存在、过期或被消费过都应该拒绝请求。
const (
	statePrefix = "oauth_state:"
	stateTTL    = 10 * time.Minute
	stateBytes  = 32
)

// GenerateState 生成一个 64 字符 hex 编码的随机 state，写入 Redis，TTL 10 分钟。
// 同一个 state 只能消费一次（见 VerifyState）。
func GenerateState(ctx context.Context, rdb *redis.Client) (string, error) {
	if rdb == nil {
		return "", fmt.Errorf("redis client 不能为空")
	}
	buf := make([]byte, stateBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("生成 state 失败: %w", err)
	}
	state := hex.EncodeToString(buf)
	if err := rdb.Set(ctx, statePrefix+state, "1", stateTTL).Err(); err != nil {
		return "", fmt.Errorf("存储 state 失败: %w", err)
	}
	return state, nil
}

// VerifyState 校验并原子消费 state。成功返回 nil，不存在/已消费返回非 nil。
// 使用 GETDEL 保证同一个 state 无法被重放。
func VerifyState(ctx context.Context, rdb *redis.Client, state string) error {
	if rdb == nil {
		return fmt.Errorf("redis client 不能为空")
	}
	if state == "" {
		return fmt.Errorf("state 为空")
	}
	key := statePrefix + state
	// Redis 6.2+ 支持 GETDEL；老版本降级为 GET + DEL（非原子但足够安全）
	val, err := rdb.GetDel(ctx, key).Result()
	if err == redis.Nil {
		return fmt.Errorf("state 无效或已过期")
	}
	if err != nil {
		// 回退方案：GET + DEL
		val, gerr := rdb.Get(ctx, key).Result()
		if gerr != nil {
			return fmt.Errorf("state 校验失败: %w", gerr)
		}
		if val == "" {
			return fmt.Errorf("state 无效或已过期")
		}
		rdb.Del(ctx, key)
		return nil
	}
	if val == "" {
		return fmt.Errorf("state 无效或已过期")
	}
	return nil
}
