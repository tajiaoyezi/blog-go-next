package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
)

// Deps 路由依赖注入容器
type Deps struct {
	AuthHandler     *AuthHandler
	CategoryHandler *CategoryHandler
	TagHandler      *TagHandler
	ArticleHandler  *ArticleHandler
	TalkHandler     *TalkHandler
	CommentHandler  *CommentHandler
	MessageHandler  *MessageHandler
	ChatHub         *ChatHub
	AlbumHandler    *AlbumHandler
	LinkHandler     *LinkHandler
	BlogInfoHandler *BlogInfoHandler
	UploadHandler   *UploadHandler
	UploadPath      string // 本地上传文件根目录，用于静态文件服务

	// Redis 客户端（用于限流、token version 缓存等）
	RDB *redis.Client
	// DB 句柄（用于 JWT 中间件查 token_version、RBAC 查角色）
	DB *gorm.DB
}

// SetupRouter 初始化路由
// 注意：从本版本起 deps.DB / deps.RDB 优先级高于可变参数 db，后者仅为向后兼容保留。
func SetupRouter(mode string, deps *Deps, db ...interface{}) *gin.Engine {
	gin.SetMode(mode)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.CORS())

	// 注入 DB 到上下文（必须在路由组注册之前，供 RBAC 中间件使用）
	var gormDB *gorm.DB
	if deps != nil && deps.DB != nil {
		gormDB = deps.DB
	} else if len(db) > 0 {
		if d, ok := db[0].(*gorm.DB); ok {
			gormDB = d
		}
	}
	if gormDB != nil {
		r.Use(middleware.InjectDB(gormDB))
	}

	var rdb *redis.Client
	if deps != nil {
		rdb = deps.RDB
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 公开接口（无需认证）
		public := v1.Group("")
		setupPublicRoutes(public, deps, rdb)

		// 需要认证的接口
		auth := v1.Group("")
		auth.Use(middleware.JWTAuth(gormDB, rdb))
		setupAuthRoutes(auth, deps)

		// 管理员接口
		admin := v1.Group("/admin")
		admin.Use(middleware.JWTAuth(gormDB, rdb), middleware.RBACAuth())
		setupAdminRoutes(admin, deps)
	}

	// 静态文件服务：上传的文件
	if deps != nil && deps.UploadPath != "" {
		r.Static("/uploads", deps.UploadPath)
	}

	return r
}

// setupPublicRoutes 注册公开路由（无需登录）
func setupPublicRoutes(rg *gin.RouterGroup, deps *Deps, rdb *redis.Client) {
	// 文章
	rg.GET("/articles", deps.ArticleHandler.ListHomeArticles)
	rg.GET("/articles/:id", deps.ArticleHandler.GetPublicArticle)
	rg.GET("/articles/archives", deps.ArticleHandler.ListArchives)
	rg.GET("/articles/search", deps.ArticleHandler.SearchArticles)
	rg.GET("/articles/condition", deps.ArticleHandler.ListByCondition)

	// 分类 & 标签
	rg.GET("/categories", deps.CategoryHandler.ListCategories)
	rg.GET("/tags", deps.TagHandler.ListTags)

	// 评论
	rg.GET("/comments", deps.CommentHandler.ListComments)

	// 说说
	rg.GET("/talks", deps.TalkHandler.ListTalks)
	rg.GET("/talks/:id", deps.TalkHandler.GetTalk)

	// 友链
	rg.GET("/links", deps.LinkHandler.ListLinks)

	// 留言（访客可匿名提交）
	rg.GET("/messages", deps.MessageHandler.ListMessages)
	rg.POST("/messages", deps.MessageHandler.SubmitMessage)

	// WebSocket 聊天（C3：已下移到认证组，此处不再暴露）

	// 站点信息
	rg.GET("/website/config", deps.BlogInfoHandler.GetWebsiteConfig)

	// 认证（真实 handler，带限流防爆破/发信滥用）
	rg.POST("/register", middleware.RateLimit(rdb, 3, time.Minute), deps.AuthHandler.Register)
	rg.POST("/login", middleware.RateLimit(rdb, 5, time.Minute), deps.AuthHandler.Login)
	rg.GET("/users/code", middleware.RateLimit(rdb, 10, time.Hour), deps.AuthHandler.SendCode)
}

// setupAuthRoutes 注册需要登录的路由
func setupAuthRoutes(rg *gin.RouterGroup, deps *Deps) {
	// 用户
	rg.PUT("/users/info", placeholder("更新用户信息"))
	rg.PUT("/users/password", deps.AuthHandler.UpdatePassword)
	rg.POST("/users/avatar", placeholder("更新头像"))

	// 互动
	rg.POST("/articles/:id/like", deps.ArticleHandler.LikeArticle)
	rg.POST("/comments", deps.CommentHandler.CreateComment)
	rg.POST("/talks/:id/like", deps.TalkHandler.LikeTalk)

	// WebSocket 聊天（C3：从公开路由下移，必须登录）
	rg.GET("/chat", deps.ChatHub.HandleWebSocket)
}

// setupAdminRoutes 注册管理员路由
func setupAdminRoutes(rg *gin.RouterGroup, deps *Deps) {
	// 仪表盘
	rg.GET("", deps.BlogInfoHandler.GetDashboard)

	// 文章管理
	rg.GET("/articles", deps.ArticleHandler.ListAdminArticles)
	rg.GET("/articles/:id", deps.ArticleHandler.GetArticle)
	rg.POST("/articles", deps.ArticleHandler.SaveOrUpdateArticle)
	rg.PUT("/articles/top", deps.ArticleHandler.ToggleTop)
	rg.PUT("/articles", deps.ArticleHandler.SoftDeleteArticles)
	rg.DELETE("/articles", deps.ArticleHandler.HardDeleteArticles)
	rg.POST("/articles/images", deps.UploadHandler.UploadImage)
	rg.POST("/articles/export", deps.ArticleHandler.ExportArticles)
	rg.POST("/articles/import", deps.ArticleHandler.ImportArticles)

	// 分类 & 标签管理
	rg.GET("/categories", deps.CategoryHandler.ListAdminCategories)
	rg.POST("/categories", deps.CategoryHandler.SaveOrUpdateCategory)
	rg.DELETE("/categories", deps.CategoryHandler.DeleteCategories)
	rg.GET("/categories/search", deps.CategoryHandler.SearchCategories)
	rg.GET("/tags", deps.TagHandler.ListAdminTags)
	rg.POST("/tags", deps.TagHandler.SaveOrUpdateTag)
	rg.DELETE("/tags", deps.TagHandler.DeleteTags)

	// 说说管理
	rg.GET("/talks", deps.TalkHandler.ListAdminTalks)
	rg.POST("/talks", deps.TalkHandler.SaveOrUpdateTalk)
	rg.DELETE("/talks", deps.TalkHandler.DeleteTalks)

	// 评论管理
	rg.GET("/comments", deps.CommentHandler.ListAdminComments)
	rg.DELETE("/comments", deps.CommentHandler.DeleteComments)
	rg.PUT("/comments/review", deps.CommentHandler.ReviewComments)

	// 留言管理
	rg.GET("/messages", deps.MessageHandler.ListAdminMessages)
	rg.DELETE("/messages", deps.MessageHandler.DeleteMessages)
	rg.PUT("/messages/review", deps.MessageHandler.ReviewMessages)

	// 用户管理
	rg.GET("/users", placeholder("用户列表"))
	rg.GET("/users/area", deps.BlogInfoHandler.GetUserArea)
	rg.PUT("/users/password", placeholder("管理员重置密码"))

	// 角色管理
	rg.GET("/roles", placeholder("角色列表"))
	rg.POST("/roles", placeholder("新增/更新角色"))
	rg.DELETE("/roles", placeholder("删除角色"))

	// 菜单管理
	rg.GET("/menus", placeholder("菜单列表"))
	rg.POST("/menus", placeholder("新增/更新菜单"))
	rg.DELETE("/menus/:id", placeholder("删除菜单"))
	rg.GET("/menus/role", placeholder("角色菜单"))

	// 资源管理
	rg.GET("/resources", placeholder("资源列表"))
	rg.POST("/resources", placeholder("新增/更新资源"))
	rg.DELETE("/resources/:id", placeholder("删除资源"))
	rg.GET("/resources/role", placeholder("角色资源"))

	// 相册管理
	rg.GET("/albums", deps.AlbumHandler.ListAdminAlbums)
	rg.POST("/albums", deps.AlbumHandler.SaveOrUpdateAlbum)
	rg.DELETE("/albums/:id", deps.AlbumHandler.DeleteAlbum)
	rg.GET("/albums/:id/photos", deps.AlbumHandler.ListPhotos)

	// 照片管理
	rg.POST("/photos", deps.AlbumHandler.SavePhotos)
	rg.PUT("/photos", deps.AlbumHandler.UpdatePhotos)
	rg.DELETE("/photos", deps.AlbumHandler.DeletePhotos)

	// 友链管理
	rg.GET("/links", deps.LinkHandler.ListAdminLinks)
	rg.POST("/links", deps.LinkHandler.SaveOrUpdateLink)
	rg.DELETE("/links", deps.LinkHandler.DeleteLinks)

	// 页面管理
	rg.GET("/pages", deps.LinkHandler.ListPages)
	rg.POST("/pages", deps.LinkHandler.SaveOrUpdatePage)
	rg.DELETE("/pages/:id", deps.LinkHandler.DeletePage)

	// 站点配置
	rg.PUT("/website/config", deps.BlogInfoHandler.UpdateWebsiteConfig)
	rg.PUT("/about", deps.BlogInfoHandler.UpdateAbout)

	// 操作日志
	rg.GET("/operation/logs", deps.BlogInfoHandler.ListLogs)
	rg.DELETE("/operation/logs", deps.BlogInfoHandler.DeleteLogs)
}

// placeholder 返回一个占位 handler，标明该接口待实现
func placeholder(desc string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"code":    50001,
			"flag":    false,
			"message": "接口待实现: " + desc,
			"data":    nil,
		})
	}
}
