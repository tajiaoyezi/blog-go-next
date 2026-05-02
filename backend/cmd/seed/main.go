// Package main 实现 seed 命令：首次部署后创建管理员账号。
//
// 使用方式：
//
//	SEED_ADMIN_EMAIL="admin@example.com" \
//	SEED_ADMIN_PASSWORD="change-me-min-8-chars" \
//	go run ./cmd/seed
//
// 或在容器中：
//
//	SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... ./bin/seed
//
// 该命令幂等：
//   - 若 tb_user_auth 中已存在任意账号，则跳过创建，只打印日志
//   - 若表为空，则基于环境变量创建 UserInfo + UserAuth + UserRole(admin)
package main

import (
	"log"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/config"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

const minPasswordLen = 8

func main() {
	email := os.Getenv("SEED_ADMIN_EMAIL")
	password := os.Getenv("SEED_ADMIN_PASSWORD")

	if email == "" {
		log.Fatal("SEED_ADMIN_EMAIL 未设置")
	}
	if password == "" {
		log.Fatal("SEED_ADMIN_PASSWORD 未设置")
	}
	if len(password) < minPasswordLen {
		log.Fatalf("SEED_ADMIN_PASSWORD 至少需要 %d 个字符", minPasswordLen)
	}

	// 加载配置（复用 server 的 config 流程）
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}
	config.Load(configPath)

	// 独立打开连接：避免复用 InitDatabase 触发 AutoMigrate/Seed
	db, err := gorm.Open(postgres.Open(config.AppConfig.Database.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 先保证角色和页面存在（幂等）
	model.SeedRoles(db)
	model.SeedPages(db)

	if err := createAdmin(db, email, password); err != nil {
		log.Fatalf("创建管理员失败: %v", err)
	}
}

// createAdmin 在 tb_user_auth 为空时创建管理员账号。
// 若已存在任何认证账号，则跳过（避免误覆盖）。
func createAdmin(db *gorm.DB, email, password string) error {
	var count int64
	if err := db.Model(&model.UserAuth{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		log.Printf("检测到 tb_user_auth 已存在 %d 条记录，跳过管理员创建", count)
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	now := time.Now()
	info := model.UserInfo{
		BaseModel: model.BaseModel{CreateTime: now},
		Email:     email,
		Nickname:  "管理员",
		Avatar:    "https://static.talkxj.com/avatar/user.png",
	}
	if err := db.Create(&info).Error; err != nil {
		return err
	}

	auth := model.UserAuth{
		BaseModel:  model.BaseModel{CreateTime: now},
		UserInfoID: info.ID,
		Username:   email,
		Password:   string(hashedPassword),
		LoginType:  1,
	}
	if err := db.Create(&auth).Error; err != nil {
		return err
	}

	// 绑定 admin 角色（ID=1 由 SeedRoles 保证）
	userRole := model.UserRole{UserID: auth.ID, RoleID: 1}
	if err := db.Create(&userRole).Error; err != nil {
		return err
	}

	log.Printf("管理员账号创建成功：username=%s, user_info_id=%d, user_auth_id=%d", email, info.ID, auth.ID)
	return nil
}
