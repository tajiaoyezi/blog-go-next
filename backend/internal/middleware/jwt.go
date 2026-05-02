package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// Claims 自定义 JWT 载荷
type Claims struct {
	UserID       int    `json:"userId"`
	UserInfoID   int    `json:"userInfoId"`
	Username     string `json:"username"`
	TokenVersion int    `json:"tv"`
	jwt.RegisteredClaims
}

var jwtSecret []byte
var jwtExpireHour int

const (
	// tokenVersionCachePrefix 用户 token version 的 Redis 缓存 key 前缀。
	// 修改密码等事件会 bump DB 中的 TokenVersion 并删除此缓存，使所有旧 token 失效。
	tokenVersionCachePrefix = "jwt_tv:"
	// tokenVersionCacheTTL 缓存过期时间。较短的 TTL 作为 DB 不可达时的兜底自愈。
	tokenVersionCacheTTL = 5 * time.Minute
)

// InitJWT 初始化 JWT 密钥和过期时间，启动时校验密钥强度
func InitJWT(secret string, expireHour int) {
	if len(secret) < 32 || secret == "change-me-in-production" {
		log.Fatal("JWT 密钥不安全：请通过环境变量 JWT_SECRET 设置至少 32 字符的随机密钥")
	}
	jwtSecret = []byte(secret)
	jwtExpireHour = expireHour
}

// GenerateToken 生成带 token version 的 JWT token。
// 调用方必须传入当前用户的 TokenVersion，这样修改密码后旧 token 会立即失效。
func GenerateToken(userID, userInfoID int, username string, tokenVersion int) (string, error) {
	claims := Claims{
		UserID:       userID,
		UserInfoID:   userInfoID,
		Username:     username,
		TokenVersion: tokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(jwtExpireHour) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "blog-go-next",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseToken 解析并验证 JWT token
func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("非预期的签名方法: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("token 解析失败: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("无效的 token")
	}
	return claims, nil
}

// JWTAuth JWT 认证中间件。
// 会从 Authorization Header 或 ?token= query 取 token（后者主要服务 WebSocket 客户端）。
// 如果传入了 db / rdb，会校验 claims.TokenVersion 与当前用户的 TokenVersion 一致，
// 以支持 token 撤销（如修改密码、封禁）。
func JWTAuth(db *gorm.DB, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractToken(c)
		if tokenStr == "" {
			abortUnauthorized(c, "未提供认证信息")
			return
		}

		claims, err := ParseToken(tokenStr)
		if err != nil {
			abortUnauthorized(c, "认证已过期或无效")
			return
		}

		// token version 校验：只在 DB 可用时执行，避免基础设施故障锁死全部用户
		if db != nil {
			currentTV, loadErr := loadUserTokenVersion(c.Request.Context(), db, rdb, claims.UserID)
			if loadErr != nil {
				log.Printf("JWT 加载 token_version 失败 userId=%d err=%v 放行", claims.UserID, loadErr)
			} else if currentTV != claims.TokenVersion {
				abortUnauthorized(c, "认证已失效，请重新登录")
				return
			}
		}

		// 将用户信息存入上下文
		c.Set("userId", claims.UserID)
		c.Set("userInfoId", claims.UserInfoID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

// extractToken 从 Header 或 query 中取 token。
// 优先级：Authorization: Bearer <token> > ?token=<token>（WebSocket 客户端常用）。
func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
		return ""
	}
	return c.Query("token")
}

func abortUnauthorized(c *gin.Context, msg string) {
	c.JSON(http.StatusUnauthorized, gin.H{
		"code":    40001,
		"flag":    false,
		"message": msg,
		"data":    nil,
	})
	c.Abort()
}

// loadUserTokenVersion 获取用户当前的 token version。
// 先查 Redis（短 TTL），miss 时回源 DB 并回填缓存。
func loadUserTokenVersion(ctx context.Context, db *gorm.DB, rdb *redis.Client, userID int) (int, error) {
	key := tokenVersionCachePrefix + strconv.Itoa(userID)

	if rdb != nil {
		cached, err := rdb.Get(ctx, key).Result()
		if err == nil {
			if tv, perr := strconv.Atoi(cached); perr == nil {
				return tv, nil
			}
		} else if err != redis.Nil {
			log.Printf("JWT token_version 缓存读取异常 userId=%d err=%v", userID, err)
		}
	}

	var row struct {
		TokenVersion int
	}
	if err := db.WithContext(ctx).
		Table("tb_user_auth").
		Select("token_version").
		Where("id = ?", userID).
		Limit(1).
		Scan(&row).Error; err != nil {
		return 0, fmt.Errorf("查询 token_version 失败: %w", err)
	}

	if rdb != nil {
		if err := rdb.Set(ctx, key, row.TokenVersion, tokenVersionCacheTTL).Err(); err != nil {
			log.Printf("JWT token_version 回填缓存失败 userId=%d err=%v", userID, err)
		}
	}
	return row.TokenVersion, nil
}

// InvalidateUserTokens 使某用户所有已签发的 token 立即失效。
// 调用方：修改密码、封禁账号、强制下线等场景。
// 做两件事：bump DB tb_user_auth.token_version、删除 Redis 缓存 key。
func InvalidateUserTokens(ctx context.Context, db *gorm.DB, rdb *redis.Client, userID int) error {
	if db == nil {
		return fmt.Errorf("db 为空，无法 bump token_version")
	}
	if err := db.WithContext(ctx).
		Table("tb_user_auth").
		Where("id = ?", userID).
		UpdateColumn("token_version", gorm.Expr("token_version + 1")).
		Error; err != nil {
		return fmt.Errorf("bump token_version 失败: %w", err)
	}
	if rdb != nil {
		if err := rdb.Del(ctx, tokenVersionCachePrefix+strconv.Itoa(userID)).Err(); err != nil {
			log.Printf("清理 token_version 缓存失败 userId=%d err=%v", userID, err)
		}
	}
	return nil
}

// GetUserID 从上下文获取当前用户 ID
func GetUserID(c *gin.Context) int {
	id, _ := c.Get("userId")
	userID, _ := id.(int)
	return userID
}

// GetUserInfoID 从上下文获取当前用户信息 ID
func GetUserInfoID(c *gin.Context) int {
	id, _ := c.Get("userInfoId")
	userInfoID, _ := id.(int)
	return userInfoID
}
