package service

import (
	"context"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

func newArticleTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(
		&model.Article{},
		&model.ArticleTag{},
		&model.Category{},
		&model.Tag{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

// TestSaveOrUpdate_UpdatePreservesImmutableFields 验证更新分支不会清零 create_time/user_id/is_delete
func TestSaveOrUpdate_UpdatePreservesImmutableFields(t *testing.T) {
	db := newArticleTestDB(t)
	svc := NewArticleService(db)

	// 预置一篇文章，create_time 取一个明确的过去时间
	createdAt := time.Date(2020, 1, 2, 3, 4, 5, 0, time.UTC)
	original := &model.Article{
		BaseModel:      model.BaseModel{CreateTime: createdAt},
		UserID:         42,
		ArticleTitle:   "old title",
		ArticleContent: "old",
		Type:           1,
		Status:         1,
		IsDelete:       true, // 模拟已软删
	}
	if err := db.Create(original).Error; err != nil {
		t.Fatalf("seed article: %v", err)
	}

	// 另一用户调用更新
	req := SaveArticleRequest{
		ID:             original.ID,
		ArticleTitle:   "new title",
		ArticleContent: "new content",
		Type:           2,
		Status:         2,
	}
	if err := svc.SaveOrUpdate(context.Background(), req, 999); err != nil {
		t.Fatalf("SaveOrUpdate: %v", err)
	}

	var got model.Article
	if err := db.First(&got, original.ID).Error; err != nil {
		t.Fatalf("read back: %v", err)
	}
	if got.ArticleTitle != "new title" {
		t.Errorf("title not updated: %s", got.ArticleTitle)
	}
	if !got.CreateTime.Equal(createdAt) {
		t.Errorf("create_time should be preserved, got %v want %v", got.CreateTime, createdAt)
	}
	if got.UserID != 42 {
		t.Errorf("user_id should be preserved, got %d", got.UserID)
	}
	if got.IsDelete != true {
		t.Errorf("is_delete should be preserved, got %v", got.IsDelete)
	}
}

// TestSaveOrUpdate_UpdateNonExistentReturnsError 文章不存在时更新应返回错误
func TestSaveOrUpdate_UpdateNonExistentReturnsError(t *testing.T) {
	db := newArticleTestDB(t)
	svc := NewArticleService(db)

	err := svc.SaveOrUpdate(context.Background(), SaveArticleRequest{
		ID:             9999,
		ArticleTitle:   "x",
		ArticleContent: "y",
	}, 1)
	if err == nil {
		t.Fatal("expected error for non-existent article, got nil")
	}
}
