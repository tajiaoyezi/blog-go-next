package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type MessageHandler struct {
	svc *service.MessageService
}

func NewMessageHandler(svc *service.MessageService) *MessageHandler {
	return &MessageHandler{svc: svc}
}

func (h *MessageHandler) ListMessages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	result, err := h.svc.ListMessages(c.Request.Context(), page, size)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *MessageHandler) SubmitMessage(c *gin.Context) {
	var req struct {
		Nickname       string `json:"nickname" binding:"required"`
		Avatar         string `json:"avatar"`
		MessageContent string `json:"messageContent" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请输入昵称和留言内容")
		return
	}

	avatar := req.Avatar
	if avatar == "" {
		avatar = "https://static.talkxj.com/avatar/user.png"
	}

	if err := h.svc.SubmitMessage(c.Request.Context(), req.Nickname, avatar, req.MessageContent, c.ClientIP()); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *MessageHandler) ListAdminMessages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	keyword := c.Query("keywords")

	var isReview *bool
	if s := c.Query("isReview"); s != "" {
		v := s == "1" || s == "true"
		isReview = &v
	}

	result, err := h.svc.ListAdminMessages(c.Request.Context(), page, size, isReview, keyword)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *MessageHandler) ReviewMessages(c *gin.Context) {
	var req struct {
		IDList   []int `json:"idList" binding:"required"`
		IsReview bool  `json:"isReview"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.Review(c.Request.Context(), req.IDList, req.IsReview); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *MessageHandler) DeleteMessages(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), ids); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}
