package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// rateLimitScript 使用 Lua 脚本原子执行滑动窗口限流。
// KEYS[1] = 限流 key
// ARGV[1] = 当前时间戳（毫秒）
// ARGV[2] = 窗口开始时间戳（毫秒）
// ARGV[3] = 最大请求数
// ARGV[4] = 窗口过期秒数
// ARGV[5] = 本次请求的唯一 member
// 返回：当前窗口内请求数；若超过上限返回负数以便调用方区分
var rateLimitScript = redis.NewScript(`
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local maxReq = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])
local member = ARGV[5]

-- 清理窗口外的记录
redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
-- 统计窗口内请求数（尚未计入当前请求）
local count = tonumber(redis.call('ZCARD', key))
if count >= maxReq then
	return count + 1
end
-- 记录当前请求
redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, ttl)
return count + 1
`)

// 包级原子计数器用于避免同毫秒 member 冲突
var rateLimitCounter uint64

// buildRateLimitMember 构造唯一 member：<now_ms>:<counter>，保证同毫秒多请求不互相覆盖。
func buildRateLimitMember(now int64) string {
	n := atomic.AddUint64(&rateLimitCounter, 1)
	return fmt.Sprintf("%d:%d", now, n)
}

// rateLimitCore 核心限流逻辑，failOpen 控制 Redis 异常时行为。
func rateLimitCore(rdb *redis.Client, maxRequests int, window time.Duration, failOpen bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rdb == nil {
			// Redis 未注入，按 fail-open/fail-closed 策略决定
			if failOpen {
				c.Next()
				return
			}
			abortTooMany(c)
			return
		}

		key := fmt.Sprintf("rate_limit:%s:%s", c.ClientIP(), c.Request.URL.Path)
		// 限流检查使用独立 timeout，避免阻塞业务请求
		ctx, cancel := context.WithTimeout(c.Request.Context(), 500*time.Millisecond)
		defer cancel()

		now := time.Now().UnixMilli()
		windowStart := now - window.Milliseconds()
		ttlSeconds := int64(window.Seconds())
		if ttlSeconds < 1 {
			ttlSeconds = 1
		}
		member := buildRateLimitMember(now)

		result, err := rateLimitScript.Run(
			ctx, rdb, []string{key},
			now, windowStart, maxRequests, ttlSeconds, member,
		).Int64()
		if err != nil {
			log.Printf("限流中间件 Redis 异常 key=%s err=%v fail_open=%v", key, err, failOpen)
			if failOpen {
				c.Next()
				return
			}
			abortTooMany(c)
			return
		}

		if result > int64(maxRequests) {
			abortTooMany(c)
			return
		}

		c.Next()
	}
}

// abortTooMany 统一 429 响应，不区分具体原因避免信息泄露。
func abortTooMany(c *gin.Context) {
	c.JSON(http.StatusTooManyRequests, gin.H{
		"code":    42900,
		"flag":    false,
		"message": "请求过于频繁，请稍后再试",
		"data":    nil,
	})
	c.Abort()
}

// RateLimit 基于 Redis 滑动窗口的限流中间件（fail-open）：Redis 异常时放行，
// 避免基础设施抖动把整个业务打挂。用于登录/注册/验证码等面向普通用户的入口。
func RateLimit(rdb *redis.Client, maxRequests int, window time.Duration) gin.HandlerFunc {
	return rateLimitCore(rdb, maxRequests, window, true)
}

// RateLimitStrict 严格模式（fail-closed）：Redis 异常时拒绝请求。
// 适用于高敏感端点（如资金、管理类接口）——宁可拒服务也不放大攻击面。
func RateLimitStrict(rdb *redis.Client, maxRequests int, window time.Duration) gin.HandlerFunc {
	return rateLimitCore(rdb, maxRequests, window, false)
}
