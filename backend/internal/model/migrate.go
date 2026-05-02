package model

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// AllModels 所有需要自动迁移的模型
var AllModels = []interface{}{
	&UserAuth{},
	&UserInfo{},
	&UserRole{},
	&Role{},
	&Article{},
	&ArticleTag{},
	&Category{},
	&Tag{},
	&Comment{},
	&Talk{},
	&Message{},
	&ChatRecord{},
	&PhotoAlbum{},
	&Photo{},
	&FriendLink{},
	&Menu{},
	&Resource{},
	&RoleMenu{},
	&RoleResource{},
	&Page{},
	&WebsiteConfig{},
	&OperationLog{},
	&UniqueView{},
}

// AutoMigrate 自动迁移所有表
func AutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(AllModels...); err != nil {
		return fmt.Errorf("数据库自动迁移失败: %w", err)
	}
	log.Printf("数据库迁移完成，共 %d 张表", len(AllModels))
	return nil
}
