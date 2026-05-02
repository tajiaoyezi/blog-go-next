package model

// PhotoAlbum 相册
type PhotoAlbum struct {
	BaseModel
	AlbumName  string `gorm:"type:varchar(20);not null" json:"albumName"`
	AlbumDesc  string `gorm:"type:varchar(50);not null" json:"albumDesc"`
	AlbumCover string `gorm:"type:varchar(255);not null" json:"albumCover"`
	IsDelete   bool   `gorm:"not null;default:false" json:"isDelete"`
	Status     int    `gorm:"type:smallint;not null;default:1;comment:1公开 2私密" json:"status"`
}

func (PhotoAlbum) TableName() string { return "tb_photo_album" }

// Photo 照片
type Photo struct {
	BaseModel
	AlbumID   int    `gorm:"not null;index" json:"albumId"`
	PhotoName string `gorm:"type:varchar(20);not null" json:"photoName"`
	PhotoDesc string `gorm:"type:varchar(50)" json:"photoDesc"`
	PhotoSrc  string `gorm:"type:varchar(255);not null" json:"photoSrc"`
	IsDelete  bool   `gorm:"not null;default:false" json:"isDelete"`
}

func (Photo) TableName() string { return "tb_photo" }

// FriendLink 友情链接
type FriendLink struct {
	BaseModel
	LinkName    string `gorm:"type:varchar(20);not null" json:"linkName"`
	LinkAvatar  string `gorm:"type:varchar(255);not null" json:"linkAvatar"`
	LinkAddress string `gorm:"type:varchar(50);not null" json:"linkAddress"`
	LinkIntro   string `gorm:"type:varchar(100);not null" json:"linkIntro"`
}

func (FriendLink) TableName() string { return "tb_friend_link" }
