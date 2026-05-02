package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type TagHandler struct {
	svc *service.TagService
}

func NewTagHandler(svc *service.TagService) *TagHandler {
	return &TagHandler{svc: svc}
}

// ListTags 前台获取标签列表
func (h *TagHandler) ListTags(c *gin.Context) {
	tags, err := h.svc.ListTags(c.Request.Context())
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, tags)
}

// ListAdminTags 后台标签列表
func (h *TagHandler) ListAdminTags(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	keyword := c.Query("keywords")

	result, err := h.svc.ListAdminTags(c.Request.Context(), page, size, keyword)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

// SaveOrUpdateTag 新增/更新标签
func (h *TagHandler) SaveOrUpdateTag(c *gin.Context) {
	var tag model.Tag
	if err := c.ShouldBindJSON(&tag); err != nil {
		FailValidation(c, "请输入标签名")
		return
	}
	if err := h.svc.SaveOrUpdate(c.Request.Context(), &tag); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

// DeleteTags 删除标签
func (h *TagHandler) DeleteTags(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		FailValidation(c, "请提供要删除的标签 ID")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), ids); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}
