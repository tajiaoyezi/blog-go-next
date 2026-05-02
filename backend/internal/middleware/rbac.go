package middleware

import (
	"log"
	"net/http"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var enforcer *casbin.Enforcer

// Casbin RBAC 模型定义
// sub = 角色标签, obj = 请求路径, act = 请求方法
// 注意：不再使用 `|| r.sub == "admin"` 的硬编码短路，admin 必须通过策略表授权。
const casbinModel = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && regexMatch(r.act, p.act)
`

// adminBootstrapSub 是 admin 角色在 policy 表中的 subject。
// 初始化时如果该 subject 下没有策略，会自动添加 "admin, /*, *" 通配策略。
const adminBootstrapSub = "admin"

// InitCasbin 初始化 Casbin 权限引擎。
// 如果 admin 角色没有任何策略，会自动补上 (admin, /*, .*) 以便首次部署可用。
func InitCasbin(db *gorm.DB) {
	adapter, err := gormadapter.NewAdapterByDB(db)
	if err != nil {
		log.Fatalf("Casbin adapter 创建失败: %v", err)
	}

	m, err := model.NewModelFromString(casbinModel)
	if err != nil {
		log.Fatalf("Casbin model 解析失败: %v", err)
	}

	enforcer, err = casbin.NewEnforcer(m, adapter)
	if err != nil {
		log.Fatalf("Casbin enforcer 创建失败: %v", err)
	}

	if err := enforcer.LoadPolicy(); err != nil {
		log.Fatalf("Casbin 策略加载失败: %v", err)
	}

	if err := ensureAdminPolicy(enforcer); err != nil {
		log.Fatalf("Casbin admin 策略初始化失败: %v", err)
	}

	log.Println("Casbin RBAC 初始化完成")
}

// ensureAdminPolicy 确保 admin 角色至少有一条全路径全方法的 allow 策略。
// 这样即使删除了硬编码短路，新部署也不会因策略表为空而锁死管理入口。
func ensureAdminPolicy(e *casbin.Enforcer) error {
	policies, err := e.GetFilteredPolicy(0, adminBootstrapSub)
	if err != nil {
		return err
	}
	if len(policies) > 0 {
		return nil
	}
	added, err := e.AddPolicy(adminBootstrapSub, "/*", ".*")
	if err != nil {
		return err
	}
	if added {
		// 只有当 enforcer 带持久化 adapter 时才 SavePolicy，避免纯内存实例 panic。
		if adapter := e.GetAdapter(); adapter != nil {
			if err := e.SavePolicy(); err != nil {
				return err
			}
		}
		log.Println("Casbin：为 admin 角色补充默认策略 (admin, /*, .*)")
	}
	return nil
}

// GetEnforcer 返回 Casbin enforcer 供外部管理策略
func GetEnforcer() *casbin.Enforcer {
	return enforcer
}

// SetEnforcerForTest 仅供单元测试注入 mock enforcer。
func SetEnforcerForTest(e *casbin.Enforcer) { enforcer = e }

// RBACAuth RBAC 鉴权中间件
func RBACAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取当前用户的角色标签
		userID := GetUserID(c)
		if userID == 0 {
			abortForbidden(c, "无权限访问")
			return
		}

		roles := getUserRoles(userID, c)
		if len(roles) == 0 {
			abortForbidden(c, "无权限访问该资源")
			return
		}

		// 检查每个角色是否有权限；admin 不再走硬编码短路，统一通过 policy
		path := c.Request.URL.Path
		method := c.Request.Method
		for _, role := range roles {
			allowed, err := enforcer.Enforce(role, path, method)
			if err != nil {
				log.Printf("Casbin 鉴权异常: %v", err)
				continue
			}
			if allowed {
				c.Next()
				return
			}
		}

		abortForbidden(c, "无权限访问该资源")
	}
}

func abortForbidden(c *gin.Context, msg string) {
	c.JSON(http.StatusForbidden, gin.H{
		"code":    40003,
		"flag":    false,
		"message": msg,
		"data":    nil,
	})
	c.Abort()
}

// getUserRoles 从数据库获取用户角色标签列表
func getUserRoles(userID int, c *gin.Context) []string {
	// 从上下文中获取 DB（通过中间件注入）
	db, exists := c.Get("db")
	if !exists {
		return nil
	}

	gormDB, ok := db.(*gorm.DB)
	if !ok {
		return nil
	}

	type RoleLabel struct {
		RoleLabel string
	}

	var labels []RoleLabel
	gormDB.Raw(`
		SELECT r.role_label
		FROM tb_user_role ur
		JOIN tb_role r ON ur.role_id = r.id
		WHERE ur.user_id = ? AND r.is_disable = false
	`, userID).Scan(&labels)

	roles := make([]string, len(labels))
	for i, l := range labels {
		roles[i] = l.RoleLabel
	}
	return roles
}
