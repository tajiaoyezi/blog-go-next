package middleware

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newTestRouter 构造最小 Gin 引擎，挂上给定中间件。
func newTestRouter(mw gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.GET("/ping", mw, func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})
	return r
}

// TestRateLimitNilClientFailOpen Redis 客户端为 nil 时默认 RateLimit 应放行。
func TestRateLimitNilClientFailOpen(t *testing.T) {
	r := newTestRouter(RateLimit(nil, 1, time.Second))
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("fail-open 模式应放行，得到 status=%d", w.Code)
	}
}

// TestRateLimitStrictNilClientFailClosed RateLimitStrict 在 Redis nil 时应拒绝。
func TestRateLimitStrictNilClientFailClosed(t *testing.T) {
	r := newTestRouter(RateLimitStrict(nil, 1, time.Second))
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusTooManyRequests {
		t.Errorf("fail-closed 模式应拒绝，得到 status=%d", w.Code)
	}
}

// TestBuildRateLimitMemberUnique 同毫秒并发调用 member 必须唯一，避免互相覆盖。
func TestBuildRateLimitMemberUnique(t *testing.T) {
	const n = 1000
	var wg sync.WaitGroup
	results := make([]string, n)
	now := time.Now().UnixMilli()
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			results[idx] = buildRateLimitMember(now)
		}(i)
	}
	wg.Wait()

	seen := make(map[string]struct{}, n)
	for _, m := range results {
		if _, dup := seen[m]; dup {
			t.Fatalf("member 冲突：%s 出现多次，同毫秒会互相覆盖", m)
		}
		seen[m] = struct{}{}
	}
}
