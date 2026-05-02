package service

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

type AlbumService struct {
	albumRepo *repository.BaseRepository[model.PhotoAlbum]
	photoRepo *repository.BaseRepository[model.Photo]
	db        *gorm.DB
}

func NewAlbumService(db *gorm.DB) *AlbumService {
	return &AlbumService{
		albumRepo: repository.NewBaseRepository[model.PhotoAlbum](db),
		photoRepo: repository.NewBaseRepository[model.Photo](db),
		db:        db,
	}
}

// AlbumVO 相册视图对象
type AlbumVO struct {
	model.PhotoAlbum
	PhotoCount int64 `json:"photoCount"`
}

// ListAlbums 前台公开相册列表
func (s *AlbumService) ListAlbums(ctx context.Context) ([]AlbumVO, error) {
	var albums []AlbumVO
	err := s.db.WithContext(ctx).
		Model(&model.PhotoAlbum{}).
		Select("tb_photo_album.*, COUNT(tb_photo.id) as photo_count").
		Joins("LEFT JOIN tb_photo ON tb_photo_album.id = tb_photo.album_id AND tb_photo.is_delete = false").
		Where("tb_photo_album.is_delete = false AND tb_photo_album.status = 1").
		Group("tb_photo_album.id").
		Order("tb_photo_album.id DESC").
		Find(&albums).Error
	return albums, err
}

// ListAdminAlbums 后台相册列表
func (s *AlbumService) ListAdminAlbums(ctx context.Context) ([]AlbumVO, error) {
	var albums []AlbumVO
	err := s.db.WithContext(ctx).
		Model(&model.PhotoAlbum{}).
		Select("tb_photo_album.*, COUNT(tb_photo.id) as photo_count").
		Joins("LEFT JOIN tb_photo ON tb_photo_album.id = tb_photo.album_id AND tb_photo.is_delete = false").
		Where("tb_photo_album.is_delete = false").
		Group("tb_photo_album.id").
		Order("tb_photo_album.id DESC").
		Find(&albums).Error
	return albums, err
}

func (s *AlbumService) SaveOrUpdateAlbum(ctx context.Context, album *model.PhotoAlbum) error {
	if album.ID > 0 {
		return s.albumRepo.Update(ctx, album.ID, map[string]interface{}{
			"album_name":  album.AlbumName,
			"album_desc":  album.AlbumDesc,
			"album_cover": album.AlbumCover,
			"status":      album.Status,
		})
	}
	return s.albumRepo.Create(ctx, album)
}

func (s *AlbumService) DeleteAlbum(ctx context.Context, id int) error {
	// 软删除相册及其下照片
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx.Model(&model.PhotoAlbum{}).Where("id = ?", id).Update("is_delete", true)
		tx.Model(&model.Photo{}).Where("album_id = ?", id).Update("is_delete", true)
		return nil
	})
}

// ListPhotos 获取相册下的照片
func (s *AlbumService) ListPhotos(ctx context.Context, albumID, page, size int) (*repository.PageResult[model.Photo], error) {
	return s.photoRepo.List(ctx, page, size, func(db *gorm.DB) *gorm.DB {
		return db.Where("album_id = ? AND is_delete = false", albumID).Order("id DESC")
	})
}

func (s *AlbumService) SavePhotos(ctx context.Context, albumID int, photoURLs []string) error {
	for _, url := range photoURLs {
		photo := model.Photo{
			AlbumID:   albumID,
			PhotoName: "",
			PhotoSrc:  url,
		}
		if err := s.photoRepo.Create(ctx, &photo); err != nil {
			return fmt.Errorf("保存照片失败: %w", err)
		}
	}
	return nil
}

func (s *AlbumService) UpdatePhotos(ctx context.Context, photos []model.Photo) error {
	for _, p := range photos {
		if p.ID <= 0 {
			continue
		}
		if err := s.photoRepo.Update(ctx, p.ID, map[string]interface{}{
			"photo_name": p.PhotoName,
			"photo_desc": p.PhotoDesc,
			"photo_src":  p.PhotoSrc,
			"album_id":   p.AlbumID,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *AlbumService) DeletePhotos(ctx context.Context, ids []int) error {
	return s.db.WithContext(ctx).Model(&model.Photo{}).Where("id IN ?", ids).Update("is_delete", true).Error
}
