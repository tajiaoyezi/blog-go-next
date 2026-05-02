package middleware

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// InjectDB 将数据库实例注入到 Gin 上下文，供 RBAC 等中间件使用
func InjectDB(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	}
}
