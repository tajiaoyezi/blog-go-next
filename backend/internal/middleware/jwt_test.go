package middleware

import (
	"testing"
)

// TestGenerateAndParseToken 验证 token_version 在 claims 中正确往返。
func TestGenerateAndParseToken(t *testing.T) {
	// InitJWT 要求 secret 长度 ≥32
	InitJWT("unit-test-secret-at-least-32-characters-long", 1)

	cases := []struct {
		name         string
		userID       int
		userInfoID   int
		username     string
		tokenVersion int
	}{
		{"zero version", 1, 10, "alice", 0},
		{"non-zero version", 42, 100, "bob@example.com", 7},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			tokenStr, err := GenerateToken(tc.userID, tc.userInfoID, tc.username, tc.tokenVersion)
			if err != nil {
				t.Fatalf("GenerateToken 失败: %v", err)
			}
			claims, err := ParseToken(tokenStr)
			if err != nil {
				t.Fatalf("ParseToken 失败: %v", err)
			}
			if claims.UserID != tc.userID {
				t.Errorf("UserID: 期望 %d 得到 %d", tc.userID, claims.UserID)
			}
			if claims.TokenVersion != tc.tokenVersion {
				t.Errorf("TokenVersion: 期望 %d 得到 %d", tc.tokenVersion, claims.TokenVersion)
			}
			if claims.Username != tc.username {
				t.Errorf("Username: 期望 %s 得到 %s", tc.username, claims.Username)
			}
		})
	}
}

// TestParseTokenRejectsTampered 篡改过的 token 必须被拒绝。
func TestParseTokenRejectsTampered(t *testing.T) {
	InitJWT("unit-test-secret-at-least-32-characters-long", 1)
	tok, err := GenerateToken(1, 1, "a", 0)
	if err != nil {
		t.Fatal(err)
	}
	// 篡改最后一个字符
	bad := tok[:len(tok)-1] + "X"
	if _, err := ParseToken(bad); err == nil {
		t.Fatal("期望篡改 token 被拒绝")
	}
}
