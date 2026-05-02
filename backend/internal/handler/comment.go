package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/middleware"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type CommentHandler struct {
	svc *service.CommentService
}

func NewCommentHandler(svc *service.CommentService) *CommentHandler {
	return &CommentHandler{svc: svc}
}

func (h *CommentHandler) ListComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	commentType, _ := strconv.Atoi(c.DefaultQuery("type", "1"))

	var topicID *int
	if s := c.Query("topicId"); s != "" {
		v, _ := strconv.Atoi(s)
		topicID = &v
	}

	result, err := h.svc.ListComments(c.Request.Context(), topicID, commentType, page, size)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var comment model.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		FailValidation(c, "请输入评论内容")
		return
	}
	comment.UserID = middleware.GetUserID(c)
	comment.IsReview = true // 默认通过审核，可改为配置

	if err := h.svc.Create(c.Request.Context(), &comment); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *CommentHandler) ListAdminComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	keyword := c.Query("keywords")

	var commentType *int
	var isReview *bool
	if s := c.Query("type"); s != "" {
		v, _ := strconv.Atoi(s)
		commentType = &v
	}
	if s := c.Query("isReview"); s != "" {
		v := s == "1" || s == "true"
		isReview = &v
	}

	result, err := h.svc.ListAdminComments(c.Request.Context(), page, size, commentType, isReview, keyword)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *CommentHandler) ReviewComments(c *gin.Context) {
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

func (h *CommentHandler) DeleteComments(c *gin.Context) {
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
