package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
)

// ChatHub 聊天室管理
type ChatHub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan []byte
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.RWMutex
	db         *gorm.DB

	upgrader websocket.Upgrader
	// debugMode 为 true 且 allowedOrigins 为空时放行全部 Origin（本地开发）
	debugMode      bool
	allowedOrigins map[string]struct{}
}

// NewChatHub 创建 ChatHub。
// allowedOrigins 为空 + debugMode=true 时允许任意 Origin；为空 + release 模式则拒绝跨域。
func NewChatHub(db *gorm.DB, debugMode bool, allowedOrigins []string) *ChatHub {
	origins := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		if o != "" {
			origins[o] = struct{}{}
		}
	}

	h := &ChatHub{
		clients:        make(map[*websocket.Conn]bool),
		broadcast:      make(chan []byte, 256),
		register:       make(chan *websocket.Conn),
		unregister:     make(chan *websocket.Conn),
		db:             db,
		debugMode:      debugMode,
		allowedOrigins: origins,
	}

	h.upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     h.checkOrigin,
	}
	return h
}

// checkOrigin 根据配置白名单决定是否接受跨域 WebSocket。
func (h *ChatHub) checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	// 无 Origin（同源请求或非浏览器）一律放行——浏览器会带 Origin
	if origin == "" {
		return true
	}
	if len(h.allowedOrigins) == 0 {
		// debug 模式便于本地开发，release 模式强制拒绝
		return h.debugMode
	}
	_, ok := h.allowedOrigins[origin]
	return ok
}

// Run 启动 Hub 消息分发循环
func (h *ChatHub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.clients[conn] = true
			h.mu.Unlock()
			log.Printf("聊天室：新连接，当前在线 %d", len(h.clients))

		case conn := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[conn]; ok {
				delete(h.clients, conn)
				conn.Close()
			}
			h.mu.Unlock()
			log.Printf("聊天室：断开连接，当前在线 %d", len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			var failed []*websocket.Conn
			for conn := range h.clients {
				if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
					failed = append(failed, conn)
				}
			}
			h.mu.RUnlock()
			// 写锁下清理失败连接
			if len(failed) > 0 {
				h.mu.Lock()
				for _, conn := range failed {
					delete(h.clients, conn)
					conn.Close()
				}
				h.mu.Unlock()
			}
		}
	}
}

// ChatIncoming 客户端入站消息（仅取业务字段，身份信息一律从 JWT + DB 推导）。
type ChatIncoming struct {
	Content string `json:"content"`
	Type    int    `json:"type"` // 1=文本 2=语音 3=撤回
}

// ChatBroadcast 下行广播消息。
// 注意：不含 IPAddress / IPSource 字段——服务端仅用于持久化与审计，不下发给客户端。
type ChatBroadcast struct {
	UserID   int    `json:"userId"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	Content  string `json:"content"`
	Type     int    `json:"type"`
}

// HandleWebSocket 处理 WebSocket 连接。
// 必须在 JWTAuth 中间件之后挂载：身份信息（userId/nickname/avatar）从 gin context + DB 取，
// 客户端传来的字段一律忽略，避免冒充。
func (h *ChatHub) HandleWebSocket(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    40001,
			"flag":    false,
			"message": "未登录用户不能加入聊天",
			"data":    nil,
		})
		return
	}

	// 从 DB 拉一次当前用户的昵称/头像，客户端伪造的字段一律丢弃
	nickname, avatar, err := h.lookupUserDisplay(c, userID)
	if err != nil {
		log.Printf("WebSocket 查询用户信息失败 userId=%d err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50000,
			"flag":    false,
			"message": "获取用户信息失败",
			"data":    nil,
		})
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket 升级失败: %v", err)
		return
	}

	h.register <- conn

	// 发送历史消息（已剥离 IP）
	h.sendHistory(conn)

	// 读取消息循环
	go func() {
		defer func() { h.unregister <- conn }()
		for {
			_, msgBytes, err := conn.ReadMessage()
			if err != nil {
				break
			}

			// 消息大小限制 10KB
			if len(msgBytes) > 10240 {
				continue
			}

			var incoming ChatIncoming
			if err := json.Unmarshal(msgBytes, &incoming); err != nil {
				continue
			}

			// 内容校验
			if incoming.Content == "" || len(incoming.Content) > 1000 {
				continue
			}

			clientIP := c.ClientIP()

			// 持久化到数据库（IP 仅保留在服务端用于审计）
			record := model.ChatRecord{
				BaseModel: model.BaseModel{CreateTime: time.Now()},
				UserID:    intPtr(userID),
				Nickname:  nickname,
				Avatar:    avatar,
				Content:   incoming.Content,
				IPAddress: clientIP,
				Type:      incoming.Type,
			}
			if err := h.db.Create(&record).Error; err != nil {
				log.Printf("写入聊天记录失败 userId=%d err=%v", userID, err)
				continue
			}

			// 广播消息（不含 IP）
			out := ChatBroadcast{
				UserID:   userID,
				Nickname: nickname,
				Avatar:   avatar,
				Content:  incoming.Content,
				Type:     incoming.Type,
			}
			data, err := json.Marshal(out)
			if err != nil {
				log.Printf("聊天消息序列化失败: %v", err)
				continue
			}
			h.broadcast <- data
		}
	}()
}

// lookupUserDisplay 通过 userId 查当前昵称和头像。
// 使用 JOIN 一次性拿到 UserInfo 中的字段，避免读取客户端自报数据。
func (h *ChatHub) lookupUserDisplay(c *gin.Context, userID int) (string, string, error) {
	type row struct {
		Nickname string
		Avatar   string
	}
	var r row
	err := h.db.WithContext(c.Request.Context()).
		Table("tb_user_auth AS ua").
		Joins("JOIN tb_user_info AS ui ON ua.user_info_id = ui.id").
		Where("ua.id = ?", userID).
		Select("ui.nickname AS nickname, ui.avatar AS avatar").
		Limit(1).
		Scan(&r).Error
	if err != nil {
		return "", "", err
	}
	if r.Nickname == "" {
		r.Nickname = "匿名用户"
	}
	return r.Nickname, r.Avatar, nil
}

func (h *ChatHub) sendHistory(conn *websocket.Conn) {
	var records []model.ChatRecord
	h.db.Order("id DESC").Limit(50).Find(&records)

	// 倒序取出后反转为正序
	for i, j := 0, len(records)-1; i < j; i, j = i+1, j-1 {
		records[i], records[j] = records[j], records[i]
	}

	for _, r := range records {
		out := ChatBroadcast{
			Nickname: r.Nickname,
			Avatar:   r.Avatar,
			Content:  r.Content,
			Type:     r.Type,
		}
		if r.UserID != nil {
			out.UserID = *r.UserID
		}
		data, err := json.Marshal(out)
		if err != nil {
			continue
		}
		_ = conn.WriteMessage(websocket.TextMessage, data)
	}
}

func intPtr(v int) *int { return &v }
