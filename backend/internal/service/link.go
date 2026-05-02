package service

import (
	"context"

	"gorm.io/gorm"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/model"
	"github.com/tajiaoyezi/blog-go-next/backend/internal/repository"
)

type LinkService struct {
	linkRepo *repository.BaseRepository[model.FriendLink]
	pageRepo *repository.BaseRepository[model.Page]
	db       *gorm.DB
}

func NewLinkService(db *gorm.DB) *LinkService {
	return &LinkService{
		linkRepo: repository.NewBaseRepository[model.FriendLink](db),
		pageRepo: repository.NewBaseRepository[model.Page](db),
		db:       db,
	}
}

// --- 友链 ---

func (s *LinkService) ListLinks(ctx context.Context) ([]model.FriendLink, error) {
	return s.linkRepo.FindAll(ctx, func(db *gorm.DB) *gorm.DB {
		return db.Order("id DESC")
	})
}

func (s *LinkService) ListAdminLinks(ctx context.Context, page, size int, keyword string) (*repository.PageResult[model.FriendLink], error) {
	return s.linkRepo.List(ctx, page, size, func(db *gorm.DB) *gorm.DB {
		if keyword != "" {
			db = db.Where("link_name LIKE ?", "%"+keyword+"%")
		}
		return db.Order("id DESC")
	})
}

func (s *LinkService) SaveOrUpdateLink(ctx context.Context, link *model.FriendLink) error {
	if link.ID > 0 {
		return s.linkRepo.Update(ctx, link.ID, map[string]interface{}{
			"link_name":    link.LinkName,
			"link_avatar":  link.LinkAvatar,
			"link_address": link.LinkAddress,
			"link_intro":   link.LinkIntro,
		})
	}
	return s.linkRepo.Create(ctx, link)
}

func (s *LinkService) DeleteLinks(ctx context.Context, ids []int) error {
	return s.linkRepo.Delete(ctx, ids)
}

// --- 页面 ---

func (s *LinkService) ListPages(ctx context.Context) ([]model.Page, error) {
	return s.pageRepo.FindAll(ctx, func(db *gorm.DB) *gorm.DB {
		return db.Order("id ASC")
	})
}

func (s *LinkService) SaveOrUpdatePage(ctx context.Context, page *model.Page) error {
	if page.ID > 0 {
		return s.pageRepo.Update(ctx, page.ID, map[string]interface{}{
			"page_name":  page.PageName,
			"page_label": page.PageLabel,
			"page_cover": page.PageCover,
		})
	}
	return s.pageRepo.Create(ctx, page)
}

func (s *LinkService) DeletePage(ctx context.Context, id int) error {
	return s.pageRepo.Delete(ctx, []int{id})
}
