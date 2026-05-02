package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type LinkHandler struct {
	svc *service.LinkService
}

func NewLinkHandler(svc *service.LinkService) *LinkHandler {
	return &LinkHandler{svc: svc}
}

func (h *LinkHandler) ListLinks(c *gin.Context) {
	data, err := h.svc.ListLinks(c.Request.Context())
	if err != nil { FailServer(c, err.Error()); return }
	OK(c, data)
}

func (h *LinkHandler) ListAdminLinks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	result, err := h.svc.ListAdminLinks(c.Request.Context(), page, size, c.Query("keywords"))
	if err != nil { FailServer(c, err.Error()); return }
	OK(c, result)
}

func (h *LinkHandler) SaveOrUpdateLink(c *gin.Context) {
	var link model.FriendLink
	if err := c.ShouldBindJSON(&link); err != nil { FailValidation(c, "参数错误"); return }
	if err := h.svc.SaveOrUpdateLink(c.Request.Context(), &link); err != nil { FailServer(c, err.Error()); return }
	OK(c, nil)
}

func (h *LinkHandler) DeleteLinks(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil { FailValidation(c, "参数错误"); return }
	if err := h.svc.DeleteLinks(c.Request.Context(), ids); err != nil { FailServer(c, err.Error()); return }
	OK(c, nil)
}

func (h *LinkHandler) ListPages(c *gin.Context) {
	data, err := h.svc.ListPages(c.Request.Context())
	if err != nil { FailServer(c, err.Error()); return }
	OK(c, data)
}

func (h *LinkHandler) SaveOrUpdatePage(c *gin.Context) {
	var page model.Page
	if err := c.ShouldBindJSON(&page); err != nil { FailValidation(c, "参数错误"); return }
	if err := h.svc.SaveOrUpdatePage(c.Request.Context(), &page); err != nil { FailServer(c, err.Error()); return }
	OK(c, nil)
}

func (h *LinkHandler) DeletePage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		FailValidation(c, "无效的页面 ID")
		return
	}
	if err := h.svc.DeletePage(c.Request.Context(), id); err != nil { FailServer(c, err.Error()); return }
	OK(c, nil)
}
