package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

type AuthService struct {
	DB  *gorm.DB
	RDB *redis.Client // 用于撤销 token 等（可空，nil 时降级）
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{DB: db}
}

// WithRedis 注入 Redis 客户端，用于 token 撤销时清理 jwt_tv 缓存。
func (s *AuthService) WithRedis(rdb *redis.Client) *AuthService {
	s.RDB = rdb
	return s
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Code     string `json:"code" binding:"required"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token    string          `json:"token"`
	UserInfo model.UserInfo  `json:"userInfo"`
}

// Register 用户注册
// 注意：为防止账号枚举攻击，对外不区分"邮箱已存在"与其他失败原因，
// 详细错误仅记录在服务端日志。
func (s *AuthService) Register(ctx context.Context, req RegisterRequest) error {
	// 检查用户名是否已存在（服务端感知即可，不暴露给调用方）
	var count int64
	s.DB.WithContext(ctx).Model(&model.UserAuth{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		log.Printf("注册失败：邮箱已存在 email=%s", req.Username)
		return fmt.Errorf("注册失败，请检查输入")
	}

	// 密码加密
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("注册失败：密码加密异常 err=%v", err)
		return fmt.Errorf("注册失败，请检查输入")
	}

	// 事务：创建 UserInfo + UserAuth + UserRole
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now()

		userInfo := model.UserInfo{
			BaseModel: model.BaseModel{CreateTime: now},
			Email:     req.Username,
			Nickname:  "用户" + req.Username[:6],
			Avatar:    "https://static.talkxj.com/avatar/user.png",
		}
		if err := tx.Create(&userInfo).Error; err != nil {
			return fmt.Errorf("创建用户信息失败: %w", err)
		}

		userAuth := model.UserAuth{
			BaseModel:     model.BaseModel{CreateTime: now},
			UserInfoID:    userInfo.ID,
			Username:      req.Username,
			Password:      string(hashedPassword),
			LoginType:     1,
			LastLoginTime: &now,
		}
		if err := tx.Create(&userAuth).Error; err != nil {
			log.Printf("创建用户认证失败 err=%v", err)
			return fmt.Errorf("注册失败，请检查输入")
		}

		// 默认分配普通用户角色（ID=2）
		userRole := model.UserRole{
			UserID: userAuth.ID,
			RoleID: 2,
		}
		if err := tx.Create(&userRole).Error; err != nil {
			log.Printf("分配角色失败 err=%v", err)
			return fmt.Errorf("注册失败，请检查输入")
		}

		return nil
	})
}

// Login 用户登录
func (s *AuthService) Login(ctx context.Context, req LoginRequest, ipAddress, ipSource string) (*LoginResponse, error) {
	var userAuth model.UserAuth
	if err := s.DB.WithContext(ctx).
		Preload("UserInfo").
		Where("username = ?", req.Username).
		First(&userAuth).Error; err != nil {
		return nil, fmt.Errorf("用户名或密码错误")
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(userAuth.Password), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("用户名或密码错误")
	}

	// 检查是否被禁用
	if userAuth.UserInfo.IsDisable {
		return nil, fmt.Errorf("该账号已被禁用")
	}

	// 生成 JWT（带 token_version，用于后续撤销）
	token, err := middleware.GenerateToken(userAuth.ID, userAuth.UserInfoID, userAuth.Username, userAuth.TokenVersion)
	if err != nil {
		return nil, fmt.Errorf("生成 token 失败: %w", err)
	}

	// 更新登录信息
	now := time.Now()
	s.DB.WithContext(ctx).Model(&userAuth).Updates(map[string]interface{}{
		"ip_address":      ipAddress,
		"ip_source":       ipSource,
		"last_login_time": now,
	})

	return &LoginResponse{
		Token:    token,
		UserInfo: userAuth.UserInfo,
	}, nil
}

// UpdatePassword 修改密码。
// 事务内同时 bump token_version，旧 JWT 立刻失效；随后清理 Redis 缓存。
func (s *AuthService) UpdatePassword(ctx context.Context, username, oldPassword, newPassword string) error {
	var userAuth model.UserAuth
	if err := s.DB.WithContext(ctx).Where("username = ?", username).First(&userAuth).Error; err != nil {
		return fmt.Errorf("用户不存在")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(userAuth.Password), []byte(oldPassword)); err != nil {
		return fmt.Errorf("旧密码错误")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("密码加密失败: %w", err)
	}

	err = s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Model(&userAuth).Updates(map[string]interface{}{
			"password":      string(hashedPassword),
			"token_version": gorm.Expr("token_version + 1"),
		}).Error
	})
	if err != nil {
		return err
	}

	// 密码修改已在事务内 bump token_version，这里只需清理 Redis 缓存。
	// 注意：不能再调用 InvalidateUserTokens（会二次 bump），直接按 key 删除即可。
	if s.RDB != nil {
		if cacheErr := s.RDB.Del(ctx, fmt.Sprintf("jwt_tv:%d", userAuth.ID)).Err(); cacheErr != nil {
			// token_version 已在 DB bump，缓存清理失败只是 TTL 内短暂不一致，记日志不阻断流程
			log.Printf("清理 token_version 缓存失败 userId=%d err=%v", userAuth.ID, cacheErr)
		}
	}
	return nil
}
