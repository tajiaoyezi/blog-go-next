package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/config"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/handler"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/es"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/mail"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/mq"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

func main() {
	// 加载配置
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}
	config.Load(configPath)

	cfg := config.AppConfig

	// 初始化基础设施
	config.InitDatabase()
	config.InitRedis()
	mq.Init(cfg.RabbitMQ.URL)
	defer mq.Close()
	es.Init(cfg.ES.Addresses)

	// 初始化 JWT
	middleware.InitJWT(cfg.JWT.Secret, cfg.JWT.ExpireHour)

	// 初始化 Casbin RBAC
	middleware.InitCasbin(config.DB)

	// 初始化邮件服务并启动消费者
	mail.Init(cfg.Mail.Host, cfg.Mail.Port, cfg.Mail.Username, cfg.Mail.Password, cfg.Mail.From)
	mail.StartConsumer()

	// 启动 Maxwell CDC 消费者（同步文章到 ES）
	service.StartMaxwellConsumer()

	// 依赖注入
	authService := service.NewAuthService(config.DB).WithRedis(config.RDB)
	categoryService := service.NewCategoryService(config.DB)
	tagService := service.NewTagService(config.DB)
	articleService := service.NewArticleService(config.DB)
	articleStatsService := service.NewArticleStatsService(config.RDB)
	talkService := service.NewTalkService(config.DB, config.RDB)
	commentService := service.NewCommentService(config.DB, config.RDB)
	messageService := service.NewMessageService(config.DB)
	albumService := service.NewAlbumService(config.DB)
	linkService := service.NewLinkService(config.DB)
	blogInfoService := service.NewBlogInfoService(config.DB)
	logService := service.NewLogService(config.DB)
	uploadService := service.NewUploadService(cfg.Upload.Mode, cfg.Upload.LocalPath, cfg.Upload.MaxSize)

	codeService := service.NewCodeService(config.RDB)
	authHandler := handler.NewAuthHandler(authService, codeService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	tagHandler := handler.NewTagHandler(tagService)
	articleHandler := handler.NewArticleHandler(articleService, articleStatsService)
	talkHandler := handler.NewTalkHandler(talkService)
	commentHandler := handler.NewCommentHandler(commentService)
	messageHandler := handler.NewMessageHandler(messageService)
	chatHub := handler.NewChatHub(config.DB, cfg.Server.Mode != "release", cfg.Server.AllowedOrigins)
	go chatHub.Run()
	albumHandler := handler.NewAlbumHandler(albumService)
	linkHandler := handler.NewLinkHandler(linkService)
	blogInfoHandler := handler.NewBlogInfoHandler(blogInfoService, logService)
	uploadHandler := handler.NewUploadHandler(uploadService)

	deps := &handler.Deps{
		AuthHandler:     authHandler,
		CategoryHandler: categoryHandler,
		TagHandler:      tagHandler,
		ArticleHandler:  articleHandler,
		TalkHandler:     talkHandler,
		CommentHandler:  commentHandler,
		MessageHandler:  messageHandler,
		ChatHub:         chatHub,
		AlbumHandler:    albumHandler,
		LinkHandler:     linkHandler,
		BlogInfoHandler: blogInfoHandler,
		UploadHandler:   uploadHandler,
		UploadPath:      cfg.Upload.LocalPath,
		DB:              config.DB,
		RDB:             config.RDB,
	}

	// 初始化路由（InjectDB 在 SetupRouter 内部注册，在路由组之前）
	router := handler.SetupRouter(cfg.Server.Mode, deps)

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// 启动服务（非阻塞）
	go func() {
		log.Printf("服务启动，监听端口 %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务启动失败: %v", err)
		}
	}()

	// 优雅关闭：监听系统信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("正在关闭服务...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("服务关闭异常: %v", err)
	}
	log.Println("服务已关闭")
}
