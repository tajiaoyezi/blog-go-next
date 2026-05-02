package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type CategoryHandler struct {
	svc *service.CategoryService
}

func NewCategoryHandler(svc *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

// ListCategories 前台获取分类列表
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	categories, err := h.svc.ListCategories(c.Request.Context())
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, categories)
}

// ListAdminCategories 后台分类列表
func (h *CategoryHandler) ListAdminCategories(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	keyword := c.Query("keywords")

	result, err := h.svc.ListAdminCategories(c.Request.Context(), page, size, keyword)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

// SaveOrUpdateCategory 新增/更新分类
func (h *CategoryHandler) SaveOrUpdateCategory(c *gin.Context) {
	var category model.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		FailValidation(c, "请输入分类名")
		return
	}
	if err := h.svc.SaveOrUpdate(c.Request.Context(), &category); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

// DeleteCategories 删除分类
func (h *CategoryHandler) DeleteCategories(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		FailValidation(c, "请提供要删除的分类 ID")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), ids); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

// SearchCategories 搜索分类
func (h *CategoryHandler) SearchCategories(c *gin.Context) {
	keyword := c.Query("keywords")
	categories, err := h.svc.SearchCategories(c.Request.Context(), keyword)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, categories)
}
