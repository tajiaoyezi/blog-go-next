package model

// Article 文章
type Article struct {
	BaseModel
	UserID         int    `gorm:"not null;index" json:"userId"`
	CategoryID     *int   `gorm:"index" json:"categoryId"`
	ArticleCover   string `gorm:"type:varchar(1024)" json:"articleCover"`
	ArticleTitle   string `gorm:"type:varchar(50);not null" json:"articleTitle"`
	ArticleContent string `gorm:"type:text;not null" json:"articleContent"`
	Type           int    `gorm:"type:smallint;not null;default:1;comment:1原创 2转载 3翻译" json:"type"`
	OriginalURL    string `gorm:"type:varchar(255)" json:"originalUrl"`
	IsTop          bool   `gorm:"not null;default:false" json:"isTop"`
	IsDelete       bool   `gorm:"not null;default:false" json:"isDelete"`
	Status         int    `gorm:"type:smallint;not null;default:1;comment:1公开 2私密 3评论可见" json:"status"`

	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags     []Tag     `gorm:"many2many:tb_article_tag;" json:"tags,omitempty"`
}

func (Article) TableName() string { return "tb_article" }

// ArticleTag 文章-标签关联
type ArticleTag struct {
	ID        int `gorm:"primaryKey;autoIncrement" json:"id"`
	ArticleID int `gorm:"not null;index" json:"articleId"`
	TagID     int `gorm:"not null;index" json:"tagId"`
}

func (ArticleTag) TableName() string { return "tb_article_tag" }

// Category 分类
type Category struct {
	BaseModel
	CategoryName string `gorm:"type:varchar(20);not null" json:"categoryName" binding:"required"`
}

func (Category) TableName() string { return "tb_category" }

// Tag 标签
type Tag struct {
	BaseModel
	TagName string `gorm:"type:varchar(20);not null" json:"tagName" binding:"required"`
}

func (Tag) TableName() string { return "tb_tag" }
