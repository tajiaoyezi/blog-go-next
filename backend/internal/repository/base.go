package repository

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

// ErrNotFound 更新目标记录不存在
var ErrNotFound = errors.New("记录不存在")

// PageResult 分页查询结果
type PageResult[T any] struct {
	Records []T   `json:"records"`
	Count   int64 `json:"count"`
	Current int   `json:"current"`
	Size    int   `json:"size"`
}

// BaseRepository 通用 CRUD 操作
type BaseRepository[T any] struct {
	DB *gorm.DB
}

func NewBaseRepository[T any](db *gorm.DB) *BaseRepository[T] {
	return &BaseRepository[T]{DB: db}
}

// Create 创建记录
func (r *BaseRepository[T]) Create(ctx context.Context, entity *T) error {
	if err := r.DB.WithContext(ctx).Create(entity).Error; err != nil {
		return fmt.Errorf("创建记录失败: %w", err)
	}
	return nil
}

// GetByID 根据 ID 查询
func (r *BaseRepository[T]) GetByID(ctx context.Context, id int) (*T, error) {
	var entity T
	if err := r.DB.WithContext(ctx).First(&entity, id).Error; err != nil {
		return nil, fmt.Errorf("查询记录失败: %w", err)
	}
	return &entity, nil
}

// Update 根据 ID 部分更新字段
// 避免 gorm.Save 在 ID 为零时变成 upsert；只更新给定 map 字段，id 不存在返回 ErrNotFound。
func (r *BaseRepository[T]) Update(ctx context.Context, id int, updates map[string]interface{}) error {
	if id <= 0 {
		return fmt.Errorf("更新记录失败: 无效的 ID")
	}
	if len(updates) == 0 {
		return fmt.Errorf("更新记录失败: 未指定更新字段")
	}
	var entity T
	tx := r.DB.WithContext(ctx).Model(&entity).Where("id = ?", id).Updates(updates)
	if tx.Error != nil {
		return fmt.Errorf("更新记录失败: %w", tx.Error)
	}
	if tx.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// Delete 根据 ID 删除
func (r *BaseRepository[T]) Delete(ctx context.Context, ids []int) error {
	var entity T
	if err := r.DB.WithContext(ctx).Delete(&entity, ids).Error; err != nil {
		return fmt.Errorf("删除记录失败: %w", err)
	}
	return nil
}

// List 分页查询
func (r *BaseRepository[T]) List(ctx context.Context, page, size int, conditions ...func(*gorm.DB) *gorm.DB) (*PageResult[T], error) {
	var entities []T
	var count int64

	db := r.DB.WithContext(ctx).Model(new(T))
	for _, cond := range conditions {
		db = cond(db)
	}

	if err := db.Count(&count).Error; err != nil {
		return nil, fmt.Errorf("查询总数失败: %w", err)
	}

	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Find(&entities).Error; err != nil {
		return nil, fmt.Errorf("分页查询失败: %w", err)
	}

	return &PageResult[T]{
		Records: entities,
		Count:   count,
		Current: page,
		Size:    size,
	}, nil
}

// FindAll 查询所有（无分页）
func (r *BaseRepository[T]) FindAll(ctx context.Context, conditions ...func(*gorm.DB) *gorm.DB) ([]T, error) {
	var entities []T
	db := r.DB.WithContext(ctx)
	for _, cond := range conditions {
		db = cond(db)
	}
	if err := db.Find(&entities).Error; err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	return entities, nil
}

// Count 条件计数
func (r *BaseRepository[T]) Count(ctx context.Context, conditions ...func(*gorm.DB) *gorm.DB) (int64, error) {
	var count int64
	db := r.DB.WithContext(ctx).Model(new(T))
	for _, cond := range conditions {
		db = cond(db)
	}
	if err := db.Count(&count).Error; err != nil {
		return 0, fmt.Errorf("计数失败: %w", err)
	}
	return count, nil
}
