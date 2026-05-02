package model

import "time"

// UserAuth 用户认证信息
type UserAuth struct {
	BaseModel
	UserInfoID    int        `gorm:"not null;index" json:"userInfoId"`
	Username      string     `gorm:"type:varchar(50);not null" json:"username"`
	Password      string     `gorm:"type:varchar(100);not null" json:"-"`
	LoginType     int        `gorm:"type:smallint;not null;default:1;comment:登录类型 1邮箱 2QQ 3微博" json:"loginType"`
	IPAddress     string     `gorm:"type:varchar(50)" json:"ipAddress"`
	IPSource      string     `gorm:"type:varchar(255)" json:"ipSource"`
	LastLoginTime *time.Time `json:"lastLoginTime"`
	// TokenVersion 用于撤销已签发 JWT：修改密码 / 强制下线时递增，
	// 旧 token 中带的版本号与此不一致则视为失效。
	TokenVersion int `gorm:"not null;default:0;comment:JWT token 版本号" json:"-"`

	UserInfo UserInfo `gorm:"foreignKey:UserInfoID" json:"userInfo,omitempty"`
}

func (UserAuth) TableName() string { return "tb_user_auth" }

// UserInfo 用户信息
type UserInfo struct {
	BaseModel
	Email     string `gorm:"type:varchar(50)" json:"email"`
	Nickname  string `gorm:"type:varchar(50);not null" json:"nickname"`
	Avatar    string `gorm:"type:varchar(1024);not null;default:'https://static.talkxj.com/avatar/user.png'" json:"avatar"`
	Intro     string `gorm:"type:varchar(255)" json:"intro"`
	WebSite   string `gorm:"type:varchar(255)" json:"webSite"`
	IsDisable bool   `gorm:"not null;default:false;comment:是否禁用" json:"isDisable"`
}

func (UserInfo) TableName() string { return "tb_user_info" }

// UserRole 用户-角色关联
type UserRole struct {
	ID     int `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID int `gorm:"not null;index" json:"userId"`
	RoleID int `gorm:"not null;index" json:"roleId"`
}

func (UserRole) TableName() string { return "tb_user_role" }

// Role 角色
type Role struct {
	BaseModel
	RoleName  string `gorm:"type:varchar(20);not null" json:"roleName"`
	RoleLabel string `gorm:"type:varchar(50);not null" json:"roleLabel"`
	IsDisable bool   `gorm:"not null;default:false" json:"isDisable"`

	Menus     []Menu     `gorm:"many2many:tb_role_menu;" json:"menus,omitempty"`
	Resources []Resource `gorm:"many2many:tb_role_resource;" json:"resources,omitempty"`
}

func (Role) TableName() string { return "tb_role" }
