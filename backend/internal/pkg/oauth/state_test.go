package oauth

import (
	"context"
	"testing"
)

// TestGenerateStateRequiresRedis 没有 Redis 客户端时必须显式报错，不能静默放行。
func TestGenerateStateRequiresRedis(t *testing.T) {
	if _, err := GenerateState(context.Background(), nil); err == nil {
		t.Fatal("期望 rdb nil 时 GenerateState 返回错误")
	}
}

// TestVerifyStateRequiresInput VerifyState 在 rdb 为 nil 或 state 为空时必须报错。
func TestVerifyStateRequiresInput(t *testing.T) {
	if err := VerifyState(context.Background(), nil, "abc"); err == nil {
		t.Error("期望 rdb nil 时 VerifyState 返回错误")
	}
}
