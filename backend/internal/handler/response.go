package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Result 统一响应结构（与原项目兼容）
type Result struct {
	Code    int         `json:"code"`
	Flag    bool        `json:"flag"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

const (
	CodeSuccess      = 20000
	CodeFail         = 50000
	CodeUnauthorized = 40001
	CodeForbidden    = 40003
	CodeNotFound     = 40004
	CodeValidation   = 40010
)

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Result{
		Code:    CodeSuccess,
		Flag:    true,
		Message: "操作成功",
		Data:    data,
	})
}

func OKWithMsg(c *gin.Context, msg string, data interface{}) {
	c.JSON(http.StatusOK, Result{
		Code:    CodeSuccess,
		Flag:    true,
		Message: msg,
		Data:    data,
	})
}

func Fail(c *gin.Context, code int, msg string) {
	c.JSON(http.StatusOK, Result{
		Code:    code,
		Flag:    false,
		Message: msg,
		Data:    nil,
	})
}

func FailValidation(c *gin.Context, msg string) {
	Fail(c, CodeValidation, msg)
}

func FailServer(c *gin.Context, msg string) {
	Fail(c, CodeFail, msg)
}
