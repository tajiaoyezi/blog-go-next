package handler

import (
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type ArticleHandler struct {
	svc      *service.ArticleService
	statsSvc *service.ArticleStatsService
}

func NewArticleHandler(svc *service.ArticleService, statsSvc *service.ArticleStatsService) *ArticleHandler {
	return &ArticleHandler{svc: svc, statsSvc: statsSvc}
}

// ExportArticles 导出文章
func (h *ArticleHandler) ExportArticles(c *gin.Context) {
	var ids []int
	// ids 可为空（导出全部），绑定失败时忽略即可
	_ = c.ShouldBindJSON(&ids)

	data, err := h.svc.ExportArticles(c.Request.Context(), ids)
	if err != nil {
		FailServer(c, err.Error())
		return
	}

	c.Header("Content-Disposition", "attachment; filename=articles.json")
	c.Data(200, "application/json", data)
}

// ImportArticles 导入文章
func (h *ArticleHandler) ImportArticles(c *gin.Context) {
	// 限制 multipart body 最大 10MB，与 service 层 scanner 缓冲上限对齐
	const maxImportBytes = 10 << 20 // 10MB
	if err := c.Request.ParseMultipartForm(maxImportBytes); err != nil {
		FailValidation(c, "上传文件过大或格式错误")
		return
	}
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		FailValidation(c, "请上传文件")
		return
	}
	defer file.Close()

	userID := middleware.GetUserID(c)
	count, err := h.svc.ImportArticles(c.Request.Context(), file, userID)
	if err != nil {
		// 部分失败仍返回 200 + 说明，完全失败走 5xx
		if count > 0 {
			OKWithMsg(c, fmt.Sprintf("成功导入 %d 篇，部分失败：%s", count, err.Error()), nil)
			return
		}
		FailServer(c, err.Error())
		return
	}
	OKWithMsg(c, fmt.Sprintf("成功导入 %d 篇文章", count), nil)
}

// LikeArticle 文章点赞/取消点赞
func (h *ArticleHandler) LikeArticle(c *gin.Context) {
	articleID, err := strconv.Atoi(c.Param("id"))
	if err != nil || articleID <= 0 {
		FailValidation(c, "无效的文章 ID")
		return
	}
	userID := middleware.GetUserID(c)

	liked, err := h.statsSvc.LikeArticle(c.Request.Context(), userID, articleID)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, gin.H{"isLike": liked})
}

// ListHomeArticles 首页文章列表
func (h *ArticleHandler) ListHomeArticles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	result, err := h.svc.ListHomeArticles(c.Request.Context(), page, size)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

// ListArchives 文章归档
func (h *ArticleHandler) ListArchives(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	result, err := h.svc.ListArchives(c.Request.Context(), page, size)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

// SearchArticles 全文搜索文章
func (h *ArticleHandler) SearchArticles(c *gin.Context) {
	keyword := c.Query("keywords")
	results, err := h.svc.SearchArticles(c.Request.Context(), keyword)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, results)
}

// ListByCondition 条件查询文章
func (h *ArticleHandler) ListByCondition(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	var categoryID, tagID *int
	if s := c.Query("categoryId"); s != "" {
		v, _ := strconv.Atoi(s)
		categoryID = &v
	}
	if s := c.Query("tagId"); s != "" {
		v, _ := strconv.Atoi(s)
		tagID = &v
	}

	result, err := h.svc.ListByCondition(c.Request.Context(), page, size, categoryID, tagID)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

// SaveOrUpdateArticle 新增/更新文章
func (h *ArticleHandler) SaveOrUpdateArticle(c *gin.Context) {
	var req service.SaveArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "请输入文章标题和内容")
		return
	}

	userID := middleware.GetUserID(c)
	if err := h.svc.SaveOrUpdate(c.Request.Context(), req, userID); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

// GetPublicArticle 公开获取文章详情（过滤私密 / 软删文章）
func (h *ArticleHandler) GetPublicArticle(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		FailValidation(c, "无效的文章 ID")
		return
	}
	article, err := h.svc.GetPublicByID(c.Request.Context(), id)
	if err != nil {
		Fail(c, CodeNotFound, err.Error())
		return
	}
	OK(c, article)
}

// GetArticle 后台获取文章详情（含草稿与软删）
func (h *ArticleHandler) GetArticle(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		FailValidation(c, "无效的文章 ID")
		return
	}
	article, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		Fail(c, CodeNotFound, err.Error())
		return
	}
	OK(c, article)
}

// ListAdminArticles 后台文章列表
func (h *ArticleHandler) ListAdminArticles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	keyword := c.Query("keywords")

	var status, categoryID, articleType *int
	var isDelete *bool

	if s := c.Query("status"); s != "" {
		v, _ := strconv.Atoi(s)
		status = &v
	}
	if s := c.Query("categoryId"); s != "" {
		v, _ := strconv.Atoi(s)
		categoryID = &v
	}
	if s := c.Query("type"); s != "" {
		v, _ := strconv.Atoi(s)
		articleType = &v
	}
	if s := c.Query("isDelete"); s != "" {
		v := s == "1" || s == "true"
		isDelete = &v
	}

	result, err := h.svc.ListAdminArticles(c.Request.Context(), page, size, keyword, status, categoryID, articleType, isDelete)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

// ToggleTop 文章置顶切换
func (h *ArticleHandler) ToggleTop(c *gin.Context) {
	var req struct {
		ID    int  `json:"id" binding:"required"`
		IsTop bool `json:"isTop"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.ToggleTop(c.Request.Context(), req.ID, req.IsTop); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

// SoftDeleteArticles 逻辑删除/恢复文章
func (h *ArticleHandler) SoftDeleteArticles(c *gin.Context) {
	var req struct {
		IDList   []int `json:"idList" binding:"required"`
		IsDelete bool  `json:"isDelete"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.SoftDelete(c.Request.Context(), req.IDList, req.IsDelete); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

// HardDeleteArticles 物理删除文章
func (h *ArticleHandler) HardDeleteArticles(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		FailValidation(c, "请提供要删除的文章 ID")
		return
	}
	if err := h.svc.HardDelete(c.Request.Context(), ids); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}
