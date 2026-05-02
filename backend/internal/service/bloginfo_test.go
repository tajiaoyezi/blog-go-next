package service

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.WebsiteConfig{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

// TestUpdateAbout_PreservesOtherConfigFields 验证 UpdateAbout 不会覆盖其它站点配置字段
func TestUpdateAbout_PreservesOtherConfigFields(t *testing.T) {
	db := newTestDB(t)
	svc := NewBlogInfoService(db)

	// 预置一份完整站点配置
	initial := map[string]interface{}{
		"websiteName":   "My Blog",
		"websiteAuthor": "Leaf",
		"aboutContent":  "old about",
	}
	initialJSON, _ := json.Marshal(initial)
	if err := svc.UpdateWebsiteConfig(context.Background(), string(initialJSON)); err != nil {
		t.Fatalf("seed config: %v", err)
	}

	// 只更新 about
	if err := svc.UpdateAbout(context.Background(), "brand new about"); err != nil {
		t.Fatalf("UpdateAbout: %v", err)
	}

	got, err := svc.GetWebsiteConfig(context.Background())
	if err != nil {
		t.Fatalf("GetWebsiteConfig: %v", err)
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(got), &parsed); err != nil {
		t.Fatalf("parse result: %v, raw=%s", err, got)
	}
	if parsed["aboutContent"] != "brand new about" {
		t.Errorf("aboutContent not updated: got %v", parsed["aboutContent"])
	}
	if parsed["websiteName"] != "My Blog" {
		t.Errorf("websiteName should be preserved: got %v", parsed["websiteName"])
	}
	if parsed["websiteAuthor"] != "Leaf" {
		t.Errorf("websiteAuthor should be preserved: got %v", parsed["websiteAuthor"])
	}
}

// TestUpdateAbout_FallbackOnInvalidJSON 旧数据不是合法 JSON 时降级为全新对象
func TestUpdateAbout_FallbackOnInvalidJSON(t *testing.T) {
	db := newTestDB(t)
	svc := NewBlogInfoService(db)

	if err := svc.UpdateWebsiteConfig(context.Background(), "not-a-json"); err != nil {
		t.Fatalf("seed bad config: %v", err)
	}

	if err := svc.UpdateAbout(context.Background(), "recovered about"); err != nil {
		t.Fatalf("UpdateAbout: %v", err)
	}

	got, _ := svc.GetWebsiteConfig(context.Background())
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(got), &parsed); err != nil {
		t.Fatalf("should now be valid json, raw=%s", got)
	}
	if parsed["aboutContent"] != "recovered about" {
		t.Errorf("aboutContent wrong: %v", parsed["aboutContent"])
	}
}
