package service

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/mail"
)

const (
	codePrefix       = "code:"
	codeTTL          = 5 * time.Minute
	codeLength       = 6
	codeDailyPrefix  = "code_daily:"
	codeDailyMax     = 5 // 每邮箱 24h 内最多 5 封验证码
	codeDailyTTL     = 24 * time.Hour
	codeCooldownLeft = codeTTL - time.Minute // 剩余 TTL 大于此值视为仍在 60s 冷却
)

type CodeService struct {
	RDB *redis.Client
}

func NewCodeService(rdb *redis.Client) *CodeService {
	return &CodeService{RDB: rdb}
}

// SendCode 发送邮箱验证码。
// 三层节流：路由层 IP 限流 + 本方法的同邮箱 60s 冷却 + 每日上限 5 次。
func (s *CodeService) SendCode(ctx context.Context, email string) error {
	// 1. 同邮箱冷却（上次发送不足 60s）
	key := codePrefix + email
	ttl, err := s.RDB.TTL(ctx, key).Result()
	if err == nil && ttl > codeCooldownLeft {
		return fmt.Errorf("验证码发送太频繁，请 60 秒后重试")
	}

	// 2. 同邮箱每日上限（24h 内不超过 codeDailyMax 次）
	dailyKey := codeDailyPrefix + email
	count, err := s.RDB.Incr(ctx, dailyKey).Result()
	if err != nil {
		return fmt.Errorf("限流检查失败: %w", err)
	}
	// 第一次创建时设置 TTL；已存在则 Expire 不会刷新
	if count == 1 {
		if err := s.RDB.Expire(ctx, dailyKey, codeDailyTTL).Err(); err != nil {
			return fmt.Errorf("限流 TTL 设置失败: %w", err)
		}
	}
	if count > codeDailyMax {
		return fmt.Errorf("今日验证码发送次数已达上限，请明日再试")
	}

	// 3. 生成 6 位随机验证码
	code := generateCode()

	// 4. 存入 Redis，5 分钟过期
	if err := s.RDB.Set(ctx, key, code, codeTTL).Err(); err != nil {
		return fmt.Errorf("存储验证码失败: %w", err)
	}

	// 5. 异步发送邮件
	emailDTO := mail.EmailDTO{
		Email:   email,
		Subject: "博客验证码",
		Content: fmt.Sprintf(`
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">验证码</h2>
				<p>您的验证码是：</p>
				<div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; border-radius: 8px;">
					%s
				</div>
				<p style="color: #999; font-size: 14px; margin-top: 20px;">验证码有效期为5分钟，请尽快使用。</p>
			</div>
		`, code),
	}

	if err := mail.SendAsync(emailDTO); err != nil {
		return fmt.Errorf("发送验证码失败: %w", err)
	}

	return nil
}

// VerifyCode 校验验证码
func (s *CodeService) VerifyCode(ctx context.Context, email, code string) bool {
	key := codePrefix + email
	storedCode, err := s.RDB.Get(ctx, key).Result()
	if err != nil {
		return false
	}
	if storedCode != code {
		return false
	}
	// 验证成功后删除
	s.RDB.Del(ctx, key)
	return true
}

func generateCode() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := ""
	for i := 0; i < codeLength; i++ {
		code += fmt.Sprintf("%d", r.Intn(10))
	}
	return code
}
