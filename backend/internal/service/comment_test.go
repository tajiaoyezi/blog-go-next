package service

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

func newCommentTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Comment{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

// TestCreate_RejectsMismatchedTopic 回复评论时 topic_id/type 与父评论不一致应被拒绝
func TestCreate_RejectsMismatchedTopic(t *testing.T) {
	db := newCommentTestDB(t)
	svc := NewCommentService(db, nil)
	ctx := context.Background()

	topicA := 100
	topicB := 200

	parent := &model.Comment{
		UserID:         1,
		CommentContent: "parent on topic A",
		Type:           1,
		TopicID:        &topicA,
		IsReview:       true,
	}
	if err := db.Create(parent).Error; err != nil {
		t.Fatalf("seed parent: %v", err)
	}

	// 场景 1：topic_id 不一致
	replyWrongTopic := &model.Comment{
		UserID:         2,
		CommentContent: "malicious reply targeting topic B",
		Type:           1,
		TopicID:        &topicB,
		ParentID:       &parent.ID,
		IsReview:       true,
	}
	if err := svc.Create(ctx, replyWrongTopic); err == nil {
		t.Error("expected topic mismatch rejection, got nil")
	}

	// 场景 2：type 不一致（父 type=1 文章，回复 type=2 友链）
	replyWrongType := &model.Comment{
		UserID:         3,
		CommentContent: "malicious reply type",
		Type:           2,
		TopicID:        &topicA,
		ParentID:       &parent.ID,
		IsReview:       true,
	}
	if err := svc.Create(ctx, replyWrongType); err == nil {
		t.Error("expected type mismatch rejection, got nil")
	}

	// 场景 3：合法回复
	validReply := &model.Comment{
		UserID:         4,
		CommentContent: "ok",
		Type:           1,
		TopicID:        &topicA,
		ParentID:       &parent.ID,
		IsReview:       true,
	}
	if err := svc.Create(ctx, validReply); err != nil {
		t.Errorf("valid reply should pass, got %v", err)
	}
}
