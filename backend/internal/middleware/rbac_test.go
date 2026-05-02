package middleware

import (
	"testing"

	"github.com/casbin/casbin/v2"
	casbinmodel "github.com/casbin/casbin/v2/model"
)

// buildTestEnforcer 构造一个纯内存 Casbin enforcer，用于测试 admin 走策略路径。
func buildTestEnforcer(t *testing.T) *casbin.Enforcer {
	t.Helper()
	m, err := casbinmodel.NewModelFromString(casbinModel)
	if err != nil {
		t.Fatalf("加载 model 失败: %v", err)
	}
	e, err := casbin.NewEnforcer(m)
	if err != nil {
		t.Fatalf("创建 enforcer 失败: %v", err)
	}
	return e
}

// TestAdminMustHaveExplicitPolicy 验证 admin 不再靠硬编码短路放行——
// 在没有添加策略前 admin 必须被拒绝。
func TestAdminMustHaveExplicitPolicy(t *testing.T) {
	e := buildTestEnforcer(t)

	allowed, err := e.Enforce("admin", "/api/v1/admin/articles", "GET")
	if err != nil {
		t.Fatalf("Enforce 出错: %v", err)
	}
	if allowed {
		t.Fatal("安全回归：admin 在无策略时不应被放行")
	}
}

// TestEnsureAdminPolicyAddsDefault 验证 ensureAdminPolicy 会为空策略表补充默认通配规则。
func TestEnsureAdminPolicyAddsDefault(t *testing.T) {
	e := buildTestEnforcer(t)

	if err := ensureAdminPolicy(e); err != nil {
		t.Fatalf("ensureAdminPolicy 出错: %v", err)
	}

	allowed, err := e.Enforce("admin", "/api/v1/admin/articles", "GET")
	if err != nil {
		t.Fatalf("Enforce 出错: %v", err)
	}
	if !allowed {
		t.Fatal("补策略后 admin 应被放行")
	}

	// 幂等：再次调用不产生重复策略
	before, _ := e.GetFilteredPolicy(0, adminBootstrapSub)
	if err := ensureAdminPolicy(e); err != nil {
		t.Fatalf("ensureAdminPolicy 第二次调用失败: %v", err)
	}
	after, _ := e.GetFilteredPolicy(0, adminBootstrapSub)
	if len(before) != len(after) {
		t.Errorf("ensureAdminPolicy 非幂等：策略数量 %d → %d", len(before), len(after))
	}
}

// TestNonAdminRespectsPolicy 非 admin 角色按 policy 精确匹配。
func TestNonAdminRespectsPolicy(t *testing.T) {
	e := buildTestEnforcer(t)
	if _, err := e.AddPolicy("editor", "/api/v1/admin/articles", "GET"); err != nil {
		t.Fatalf("AddPolicy 出错: %v", err)
	}

	ok, err := e.Enforce("editor", "/api/v1/admin/articles", "GET")
	if err != nil || !ok {
		t.Errorf("editor 应对匹配路径放行，got=%v err=%v", ok, err)
	}
	// 未匹配的方法应被拒绝
	bad, err := e.Enforce("editor", "/api/v1/admin/articles", "DELETE")
	if err != nil {
		t.Fatalf("Enforce 出错: %v", err)
	}
	if bad {
		t.Error("editor 不应被允许 DELETE /api/v1/admin/articles")
	}
	// 其他角色不应继承
	other, _ := e.Enforce("guest", "/api/v1/admin/articles", "GET")
	if other {
		t.Error("guest 不应被放行")
	}
}
