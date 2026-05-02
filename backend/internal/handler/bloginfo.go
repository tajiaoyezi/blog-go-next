package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type BlogInfoHandler struct {
	svc    *service.BlogInfoService
	logSvc *service.LogService
}

func NewBlogInfoHandler(svc *service.BlogInfoService, logSvc *service.LogService) *BlogInfoHandler {
	return &BlogInfoHandler{svc: svc, logSvc: logSvc}
}

func (h *BlogInfoHandler) GetDashboard(c *gin.Context) {
	data, err := h.svc.GetDashboard(c.Request.Context())
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, data)
}

func (h *BlogInfoHandler) GetWebsiteConfig(c *gin.Context) {
	config, err := h.svc.GetWebsiteConfig(c.Request.Context())
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, config)
}

func (h *BlogInfoHandler) UpdateWebsiteConfig(c *gin.Context) {
	var req struct {
		Config string `json:"config" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请提供站点配置")
		return
	}
	if err := h.svc.UpdateWebsiteConfig(c.Request.Context(), req.Config); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *BlogInfoHandler) UpdateAbout(c *gin.Context) {
	var req struct {
		AboutContent string `json:"aboutContent" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请输入关于我内容")
		return
	}
	if err := h.svc.UpdateAbout(c.Request.Context(), req.AboutContent); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *BlogInfoHandler) GetUserArea(c *gin.Context) {
	areaType, _ := strconv.Atoi(c.DefaultQuery("type", "1"))
	data, err := h.svc.GetUserArea(c.Request.Context(), areaType)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, data)
}

// --- 操作日志 ---
func (h *BlogInfoHandler) ListLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	result, err := h.logSvc.ListLogs(c.Request.Context(), page, size, c.Query("keywords"))
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *BlogInfoHandler) DeleteLogs(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.logSvc.DeleteLogs(c.Request.Context(), ids); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}
