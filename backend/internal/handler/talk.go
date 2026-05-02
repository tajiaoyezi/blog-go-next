package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type TalkHandler struct {
	svc *service.TalkService
}

func NewTalkHandler(svc *service.TalkService) *TalkHandler {
	return &TalkHandler{svc: svc}
}

func (h *TalkHandler) ListTalks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	result, err := h.svc.ListTalks(c.Request.Context(), page, size)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *TalkHandler) GetTalk(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		FailValidation(c, "无效的说说 ID")
		return
	}
	talk, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		Fail(c, CodeNotFound, err.Error())
		return
	}
	OK(c, talk)
}

func (h *TalkHandler) SaveOrUpdateTalk(c *gin.Context) {
	var talk model.Talk
	if err := c.ShouldBindJSON(&talk); err != nil {
		FailValidation(c, "请输入说说内容")
		return
	}
	talk.UserID = middleware.GetUserID(c)
	if err := h.svc.SaveOrUpdate(c.Request.Context(), &talk); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *TalkHandler) DeleteTalks(c *gin.Context) {
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

func (h *TalkHandler) LikeTalk(c *gin.Context) {
	talkID, err := strconv.Atoi(c.Param("id"))
	if err != nil || talkID <= 0 {
		FailValidation(c, "无效的说说 ID")
		return
	}
	userID := middleware.GetUserID(c)
	liked, err := h.svc.LikeTalk(c.Request.Context(), userID, talkID)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, gin.H{"isLike": liked})
}

func (h *TalkHandler) ListAdminTalks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	var status *int
	if s := c.Query("status"); s != "" {
		v, _ := strconv.Atoi(s)
		status = &v
	}
	result, err := h.svc.ListAdminTalks(c.Request.Context(), page, size, status)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}
