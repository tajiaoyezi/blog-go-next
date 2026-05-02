package model

import (
	"log"
	"time"

	"gorm.io/gorm"
)

// Seed 填充非敏感初始数据（角色 + 默认页面）。
//
// 注意：为避免在生产环境创建可预测的默认管理员凭据，
// 管理员账号的创建已移动到独立命令 `cmd/seed`，读取环境变量完成。
// 启动流程如需初始化基础数据，仍可调用该函数。
func Seed(db *gorm.DB) {
	SeedRoles(db)
	SeedPages(db)
	log.Println("基础种子数据填充完成（角色 + 页面）")
}

// SeedRoles 初始化内置角色（幂等：仅在表为空时执行）。
func SeedRoles(db *gorm.DB) {
	var count int64
	db.Model(&Role{}).Count(&count)
	if count > 0 {
		return
	}

	now := time.Now()
	roles := []Role{
		{BaseModel: BaseModel{ID: 1, CreateTime: now}, RoleName: "管理员", RoleLabel: "admin"},
		{BaseModel: BaseModel{ID: 2, CreateTime: now}, RoleName: "普通用户", RoleLabel: "user"},
		{BaseModel: BaseModel{ID: 3, CreateTime: now}, RoleName: "测试", RoleLabel: "test"},
	}
	db.Create(&roles)
}

// SeedPages 初始化内置页面配置（幂等）。
func SeedPages(db *gorm.DB) {
	var count int64
	db.Model(&Page{}).Count(&count)
	if count > 0 {
		return
	}

	now := time.Now()
	pages := []Page{
		{BaseModel: BaseModel{CreateTime: now}, PageName: "首页", PageLabel: "home", PageCover: "https://static.talkxj.com/config/0bee7ba5ac70155766648e14ae2a821f.jpg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "归档", PageLabel: "archive", PageCover: "https://static.talkxj.com/config/643f28683e1c59a80ccfc9cb19735a9c.jpg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "分类", PageLabel: "category", PageCover: "https://static.talkxj.com/config/83be0017d7f1a29441e33083e7706936.jpg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "标签", PageLabel: "tag", PageCover: "https://static.talkxj.com/config/a6f141372509365891081d755da963a1.png"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "相册", PageLabel: "album", PageCover: "https://static.talkxj.com/config/1ecb6fc94e38c38713000efe37492e73.png"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "友链", PageLabel: "link", PageCover: "https://static.talkxj.com/config/9034edddec5b8e8542c2e61b0da1c1da.jpg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "关于", PageLabel: "about", PageCover: "https://static.talkxj.com/config/2a56d15dd742ff8ac238a512d9a472a1.jpg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "留言", PageLabel: "message", PageCover: "https://static.talkxj.com/config/acfeab8379508233fa7e4febf90c2f2e.png"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "个人中心", PageLabel: "user", PageCover: "https://static.talkxj.com/config/ebae4c93de1b286a8d50aa62612caa59.jpeg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "文章列表", PageLabel: "articleList", PageCover: "https://static.talkxj.com/config/924d65cc8312e6cdad2160eb8fce6831.jpg"},
		{BaseModel: BaseModel{CreateTime: now}, PageName: "说说", PageLabel: "talk", PageCover: "https://static.talkxj.com/config/a741b0656a9a3db2e2ba5c2f4140eb6c.jpg"},
	}
	db.Create(&pages)
}
