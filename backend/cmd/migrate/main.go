// Package main 实现 migrate 命令：显式执行 GORM AutoMigrate。
//
// 使用场景：生产/多副本部署时 AUTO_MIGRATE_ON_STARTUP=false，
// 改为在部署流水线中执行本命令完成 schema 同步，避免多副本滚动启动抢锁。
//
// 使用方式：
//
//	go run ./cmd/migrate        # 本地
//	./bin/migrate                # 容器内
//
// 同时会幂等初始化内置角色和页面（不会创建管理员）。
package main

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/config"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

func main() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}
	config.Load(configPath)

	db, err := gorm.Open(postgres.Open(config.AppConfig.Database.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	if err := model.AutoMigrate(db); err != nil {
		log.Fatalf("迁移失败: %v", err)
	}

	// 基础数据（角色 + 页面）一并初始化，保证首次迁移后即可使用
	model.SeedRoles(db)
	model.SeedPages(db)

	log.Println("迁移完成")
}
