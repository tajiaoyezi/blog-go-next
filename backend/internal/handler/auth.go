package handler

import (
	"net/mail"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
	codeService *service.CodeService
}

func NewAuthHandler(authService *service.AuthService, codeService *service.CodeService) *AuthHandler {
	return &AuthHandler{authService: authService, codeService: codeService}
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请输入有效的邮箱和密码（密码至少6位）")
		return
	}

	// 验证邮箱验证码
	if !h.codeService.VerifyCode(c.Request.Context(), req.Username, req.Code) {
		FailValidation(c, "验证码错误或已过期")
		return
	}

	if err := h.authService.Register(c.Request.Context(), req); err != nil {
		FailServer(c, err.Error())
		return
	}

	OKWithMsg(c, "注册成功", nil)
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请输入用户名和密码")
		return
	}

	ipAddress := c.ClientIP()
	resp, err := h.authService.Login(c.Request.Context(), req, ipAddress, "")
	if err != nil {
		Fail(c, CodeUnauthorized, err.Error())
		return
	}

	OK(c, resp)
}

// SendCode 发送验证码。
// 格式校验 + 服务层限流（每邮箱 60s 冷却 / 每 24h 上限）+ 路由层 IP 限流三层防护。
// 对外错误统一为"请求过于频繁"，不暴露具体原因以防探测。
func (h *AuthHandler) SendCode(c *gin.Context) {
	email := strings.TrimSpace(c.Query("username"))
	if email == "" {
		FailValidation(c, "请提供邮箱地址")
		return
	}
	if !isValidEmail(email) {
		FailValidation(c, "邮箱格式错误")
		return
	}

	if err := h.codeService.SendCode(c.Request.Context(), email); err != nil {
		// 服务层会返回精细化错误（冷却中 / 超限 / 发送失败），对外统一模糊化
		FailServer(c, "请求过于频繁，请稍后再试")
		return
	}

	OK(c, nil)
}

// isValidEmail 使用 net/mail 解析 + 长度/字符二次校验。
// net/mail.ParseAddress 严格按 RFC 5322，但接受 "Name <x@y>"，
// 因此先过一下是否不含空格 + 形如 xxx@yyy。
func isValidEmail(s string) bool {
	if len(s) < 3 || len(s) > 254 {
		return false
	}
	if strings.ContainsAny(s, " \t\n\r<>\"") {
		return false
	}
	at := strings.IndexByte(s, '@')
	if at <= 0 || at == len(s)-1 {
		return false
	}
	if _, err := mail.ParseAddress(s); err != nil {
		return false
	}
	return true
}

// UpdatePassword 修改密码
func (h *AuthHandler) UpdatePassword(c *gin.Context) {
	var req struct {
		OldPassword string `json:"oldPassword" binding:"required"`
		NewPassword string `json:"newPassword" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请输入旧密码和新密码")
		return
	}

	username, _ := c.Get("username")
	if err := h.authService.UpdatePassword(c.Request.Context(), username.(string), req.OldPassword, req.NewPassword); err != nil {
		FailServer(c, err.Error())
		return
	}

	OKWithMsg(c, "密码修改成功", nil)
}
