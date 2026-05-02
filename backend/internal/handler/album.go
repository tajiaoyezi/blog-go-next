package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/service"
)

type AlbumHandler struct {
	svc *service.AlbumService
}

func NewAlbumHandler(svc *service.AlbumService) *AlbumHandler {
	return &AlbumHandler{svc: svc}
}

func (h *AlbumHandler) ListAlbums(c *gin.Context) {
	albums, err := h.svc.ListAlbums(c.Request.Context())
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, albums)
}

func (h *AlbumHandler) ListAdminAlbums(c *gin.Context) {
	albums, err := h.svc.ListAdminAlbums(c.Request.Context())
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, albums)
}

func (h *AlbumHandler) SaveOrUpdateAlbum(c *gin.Context) {
	var album model.PhotoAlbum
	if err := c.ShouldBindJSON(&album); err != nil {
		FailValidation(c, "请填写相册信息")
		return
	}
	if err := h.svc.SaveOrUpdateAlbum(c.Request.Context(), &album); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *AlbumHandler) DeleteAlbum(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		FailValidation(c, "无效的相册 ID")
		return
	}
	if err := h.svc.DeleteAlbum(c.Request.Context(), id); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *AlbumHandler) ListPhotos(c *gin.Context) {
	albumID, err := strconv.Atoi(c.Param("id"))
	if err != nil || albumID <= 0 {
		FailValidation(c, "无效的相册 ID")
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("current", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	result, err := h.svc.ListPhotos(c.Request.Context(), albumID, page, size)
	if err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, result)
}

func (h *AlbumHandler) SavePhotos(c *gin.Context) {
	var req struct {
		AlbumID   int      `json:"albumId" binding:"required"`
		PhotoURLs []string `json:"photoUrlList" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.SavePhotos(c.Request.Context(), req.AlbumID, req.PhotoURLs); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *AlbumHandler) UpdatePhotos(c *gin.Context) {
	var photos []model.Photo
	if err := c.ShouldBindJSON(&photos); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.UpdatePhotos(c.Request.Context(), photos); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}

func (h *AlbumHandler) DeletePhotos(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		FailValidation(c, "参数错误")
		return
	}
	if err := h.svc.DeletePhotos(c.Request.Context(), ids); err != nil {
		FailServer(c, err.Error())
		return
	}
	OK(c, nil)
}
