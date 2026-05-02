package model

// Comment 评论
type Comment struct {
	BaseModel
	UserID         int    `gorm:"not null;index" json:"userId"`
	TopicID        *int   `json:"topicId"`
	CommentContent string `gorm:"type:text;not null" json:"commentContent"`
	ReplyUserID    *int   `json:"replyUserId"`
	ParentID       *int   `gorm:"index" json:"parentId"`
	Type           int    `gorm:"type:smallint;not null;comment:1文章 2友链 3说说" json:"type"`
	IsDelete       bool   `gorm:"not null;default:false" json:"isDelete"`
	IsReview       bool   `gorm:"not null;default:true;comment:是否通过审核" json:"isReview"`
}

func (Comment) TableName() string { return "tb_comment" }

// Talk 说说
type Talk struct {
	BaseModel
	UserID  int    `gorm:"not null;index" json:"userId"`
	Content string `gorm:"type:varchar(2000);not null" json:"content" binding:"required"`
	Images  string `gorm:"type:varchar(2500);comment:图片URL逗号分隔" json:"images"`
	IsTop   bool   `gorm:"not null;default:false" json:"isTop"`
	Status  int    `gorm:"type:smallint;not null;default:1;comment:1公开 2私密" json:"status"`
}

func (Talk) TableName() string { return "tb_talk" }

// Message 留言
type Message struct {
	BaseModel
	Nickname       string `gorm:"type:varchar(50);not null" json:"nickname"`
	Avatar         string `gorm:"type:varchar(255);not null" json:"avatar"`
	MessageContent string `gorm:"type:varchar(255);not null" json:"messageContent"`
	IPAddress      string `gorm:"type:varchar(50);not null" json:"ipAddress"`
	IPSource       string `gorm:"type:varchar(255)" json:"ipSource"`
	Time           *int   `gorm:"type:smallint;comment:弹幕速度" json:"time"`
	IsReview       bool   `gorm:"not null;default:true" json:"isReview"`
}

func (Message) TableName() string { return "tb_message" }

// ChatRecord 聊天记录。
// IPAddress / IPSource 仅用于服务端审计，绝不以 JSON 形式出库给客户端，
// 因此明确标注 json:"-"。
type ChatRecord struct {
	BaseModel
	UserID    *int   `json:"userId"`
	Nickname  string `gorm:"type:varchar(50);not null" json:"nickname"`
	Avatar    string `gorm:"type:varchar(255);not null" json:"avatar"`
	Content   string `gorm:"type:varchar(1000);not null" json:"content"`
	IPAddress string `gorm:"type:varchar(50);not null" json:"-"`
	IPSource  string `gorm:"type:varchar(255)" json:"-"`
	Type      int    `gorm:"type:smallint;not null" json:"type"`
}

func (ChatRecord) TableName() string { return "tb_chat_record" }
