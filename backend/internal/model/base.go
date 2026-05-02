package model

import "time"

// BaseModel 通用基础字段
type BaseModel struct {
	ID         int        `gorm:"primaryKey;autoIncrement" json:"id"`
	CreateTime time.Time  `gorm:"not null;autoCreateTime" json:"createTime"`
	UpdateTime *time.Time `gorm:"autoUpdateTime" json:"updateTime"`
}
