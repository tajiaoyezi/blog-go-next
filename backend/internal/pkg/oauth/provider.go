package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// 安全注意：
// 调用方 **必须** 先调用 GenerateState（见 state.go）得到 state 并带到授权 URL 里，
// 在 callback handler 中先调用 VerifyState（消费式）再调用 GetAccessToken。
// 跳过 state 校验会导致 OAuth CSRF / 账号劫持。
//
// 典型调用流程：
//
//	state, _ := oauth.GenerateState(ctx, rdb)
//	authURL := provider.AuthorizeURL(state)
//	// ... 用户跳转第三方授权，返回 callback ...
//	if err := oauth.VerifyState(ctx, rdb, receivedState); err != nil { reject }
//	token, _ := provider.GetAccessToken(ctx, code)

// Provider OAuth 提供者接口
type Provider interface {
	// AuthorizeURL 返回授权 URL，实现必须把 state 原样带进 URL。
	AuthorizeURL(state string) string
	// GetAccessToken 用授权码换取 access token
	GetAccessToken(ctx context.Context, code string) (string, error)
	// GetUserInfo 用 access token 获取用户信息
	GetUserInfo(ctx context.Context, accessToken string) (*OAuthUserInfo, error)
}

// OAuthUserInfo 第三方用户信息
type OAuthUserInfo struct {
	OpenID   string `json:"openId"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
}

// --- QQ OAuth ---

type QQProvider struct {
	AppID     string
	AppKey    string
	RedirectURI string
}

func NewQQProvider(appID, appKey, redirectURI string) *QQProvider {
	return &QQProvider{AppID: appID, AppKey: appKey, RedirectURI: redirectURI}
}

// AuthorizeURL 构造 QQ 登录授权 URL，强制带 state 参数。
func (p *QQProvider) AuthorizeURL(state string) string {
	q := url.Values{
		"response_type": {"code"},
		"client_id":     {p.AppID},
		"redirect_uri":  {p.RedirectURI},
		"state":         {state},
		"scope":         {"get_user_info"},
	}
	return "https://graph.qq.com/oauth2.0/authorize?" + q.Encode()
}

func (p *QQProvider) GetAccessToken(ctx context.Context, code string) (string, error) {
	params := url.Values{
		"grant_type":   {"authorization_code"},
		"client_id":    {p.AppID},
		"client_secret": {p.AppKey},
		"code":         {code},
		"redirect_uri": {p.RedirectURI},
	}

	resp, err := http.Get("https://graph.qq.com/oauth2.0/token?" + params.Encode())
	if err != nil {
		return "", fmt.Errorf("QQ 获取 token 失败: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	values, _ := url.ParseQuery(string(body))
	token := values.Get("access_token")
	if token == "" {
		return "", fmt.Errorf("QQ 返回 token 为空: %s", string(body))
	}
	return token, nil
}

func (p *QQProvider) GetUserInfo(ctx context.Context, accessToken string) (*OAuthUserInfo, error) {
	// 先获取 OpenID
	resp, err := http.Get("https://graph.qq.com/oauth2.0/me?access_token=" + accessToken + "&fmt=json")
	if err != nil {
		return nil, fmt.Errorf("获取 QQ OpenID 失败: %w", err)
	}
	defer resp.Body.Close()

	var meResult struct {
		OpenID string `json:"openid"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&meResult); err != nil {
		return nil, fmt.Errorf("解析 QQ OpenID 失败: %w", err)
	}

	// 获取用户信息
	infoURL := fmt.Sprintf("https://graph.qq.com/user/get_user_info?access_token=%s&oauth_consumer_key=%s&openid=%s",
		accessToken, p.AppID, meResult.OpenID)
	resp2, err := http.Get(infoURL)
	if err != nil {
		return nil, fmt.Errorf("获取 QQ 用户信息失败: %w", err)
	}
	defer resp2.Body.Close()

	var userInfo struct {
		Nickname string `json:"nickname"`
		Avatar   string `json:"figureurl_qq_2"`
	}
	if err := json.NewDecoder(resp2.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("解析 QQ 用户信息失败: %w", err)
	}

	return &OAuthUserInfo{
		OpenID:   meResult.OpenID,
		Nickname: userInfo.Nickname,
		Avatar:   userInfo.Avatar,
	}, nil
}

// --- 微博 OAuth ---

type WeiboProvider struct {
	AppID     string
	AppSecret string
	RedirectURI string
}

func NewWeiboProvider(appID, appSecret, redirectURI string) *WeiboProvider {
	return &WeiboProvider{AppID: appID, AppSecret: appSecret, RedirectURI: redirectURI}
}

// AuthorizeURL 构造微博登录授权 URL，强制带 state 参数。
func (p *WeiboProvider) AuthorizeURL(state string) string {
	q := url.Values{
		"response_type": {"code"},
		"client_id":     {p.AppID},
		"redirect_uri":  {p.RedirectURI},
		"state":         {state},
	}
	return "https://api.weibo.com/oauth2/authorize?" + q.Encode()
}

func (p *WeiboProvider) GetAccessToken(ctx context.Context, code string) (string, error) {
	params := url.Values{
		"grant_type":    {"authorization_code"},
		"client_id":     {p.AppID},
		"client_secret": {p.AppSecret},
		"code":          {code},
		"redirect_uri":  {p.RedirectURI},
	}

	resp, err := http.PostForm("https://api.weibo.com/oauth2/access_token", params)
	if err != nil {
		return "", fmt.Errorf("微博获取 token 失败: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		AccessToken string `json:"access_token"`
		UID         string `json:"uid"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("解析微博 token 失败: %w", err)
	}
	if result.AccessToken == "" {
		return "", fmt.Errorf("微博返回 token 为空")
	}
	return result.AccessToken + ":" + result.UID, nil // 拼接 UID 方便后续使用
}

func (p *WeiboProvider) GetUserInfo(ctx context.Context, tokenAndUID string) (*OAuthUserInfo, error) {
	// 拆分 token 和 UID
	var token, uid string
	if i := len(tokenAndUID) - 1; i > 0 {
		for j := i; j >= 0; j-- {
			if tokenAndUID[j] == ':' {
				token = tokenAndUID[:j]
				uid = tokenAndUID[j+1:]
				break
			}
		}
	}

	infoURL := fmt.Sprintf("https://api.weibo.com/2/users/show.json?access_token=%s&uid=%s", token, uid)
	resp, err := http.Get(infoURL)
	if err != nil {
		return nil, fmt.Errorf("获取微博用户信息失败: %w", err)
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID              int64  `json:"id"`
		ScreenName      string `json:"screen_name"`
		ProfileImageURL string `json:"profile_image_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("解析微博用户信息失败: %w", err)
	}

	return &OAuthUserInfo{
		OpenID:   fmt.Sprintf("%d", userInfo.ID),
		Nickname: userInfo.ScreenName,
		Avatar:   userInfo.ProfileImageURL,
	}, nil
}
