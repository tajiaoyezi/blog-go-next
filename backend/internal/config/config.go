package config

import (
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/spf13/viper"
)

// Config 应用全局配置
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	RabbitMQ RabbitMQConfig `mapstructure:"rabbitmq"`
	ES       ESConfig       `mapstructure:"elasticsearch"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Mail     MailConfig     `mapstructure:"mail"`
	Upload   UploadConfig   `mapstructure:"upload"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
	Mode string `mapstructure:"mode"` // debug / release / test
	// AllowedOrigins WebSocket / CORS 允许的 Origin 白名单（精确匹配）。
	// release 模式为空时拒绝所有跨域请求；debug 模式为空时放行（便于本地开发）。
	AllowedOrigins []string `mapstructure:"allowed_origins"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DBName   string `mapstructure:"dbname"`
	SSLMode  string `mapstructure:"sslmode"`
}

// DSN 返回 PostgreSQL 连接字符串
func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode)
}

type RedisConfig struct {
	Addr     string `mapstructure:"addr"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type RabbitMQConfig struct {
	URL string `mapstructure:"url"` // amqp://user:pass@host:port/vhost
}

type ESConfig struct {
	Addresses []string `mapstructure:"addresses"`
}

type JWTConfig struct {
	Secret     string `mapstructure:"secret"`
	ExpireHour int    `mapstructure:"expire_hour"`
}

type MailConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	From     string `mapstructure:"from"`
}

type UploadConfig struct {
	Mode      string `mapstructure:"mode"` // local / oss / cos
	LocalPath string `mapstructure:"local_path"`
	MaxSize   int64  `mapstructure:"max_size_mb"`
}

var AppConfig Config

// envBindings 列出需要显式 BindEnv 的关键配置路径。
// 显式绑定能保证在未提供 YAML 文件、完全用环境变量部署的场景下
// （例如 Kubernetes ConfigMap/Secret）配置也能被正确读取。
var envBindings = []string{
	"server.port",
	"server.mode",
	"database.host",
	"database.port",
	"database.user",
	"database.password",
	"database.dbname",
	"database.sslmode",
	"redis.addr",
	"redis.password",
	"redis.db",
	"rabbitmq.url",
	"elasticsearch.addresses",
	"jwt.secret",
	"jwt.expire_hour",
	"mail.host",
	"mail.port",
	"mail.username",
	"mail.password",
	"mail.from",
	"upload.mode",
	"upload.local_path",
	"upload.max_size_mb",
}

// Load 加载配置文件；配置文件不存在时不致命，退化为仅使用环境变量。
//
// 环境变量约定：
//   - 点号替换为下划线（server.port -> SERVER_PORT）
//   - 所有环境变量大小写敏感，建议统一大写
//
// 必填项：jwt.secret、database.host、database.user、database.dbname
func Load(path string) {
	viper.SetConfigFile(path)
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// 显式 BindEnv 才能让 Unmarshal 感知到环境变量（AutomaticEnv 对 Unmarshal 有已知限制）
	for _, key := range envBindings {
		_ = viper.BindEnv(key)
	}

	if err := viper.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		// 文件不存在是允许的 —— 退化为仅使用环境变量
		if errors.As(err, &notFound) || strings.Contains(err.Error(), "no such file") {
			log.Printf("未找到配置文件 %s，使用环境变量加载配置", path)
		} else {
			log.Fatalf("读取配置文件失败: %v", err)
		}
	}

	if err := viper.Unmarshal(&AppConfig); err != nil {
		log.Fatalf("解析配置文件失败: %v", err)
	}

	if err := validate(&AppConfig); err != nil {
		log.Fatalf("配置校验失败: %v", err)
	}

	log.Printf("配置加载完成，运行模式: %s", AppConfig.Server.Mode)
}

// validate 检查必填配置。缺失时返回错误，由调用方决定是否 fatal。
func validate(cfg *Config) error {
	var missing []string
	if strings.TrimSpace(cfg.JWT.Secret) == "" {
		missing = append(missing, "jwt.secret (env: JWT_SECRET)")
	}
	if strings.TrimSpace(cfg.Database.Host) == "" {
		missing = append(missing, "database.host (env: DATABASE_HOST)")
	}
	if strings.TrimSpace(cfg.Database.User) == "" {
		missing = append(missing, "database.user (env: DATABASE_USER)")
	}
	if strings.TrimSpace(cfg.Database.DBName) == "" {
		missing = append(missing, "database.dbname (env: DATABASE_DBNAME)")
	}
	if len(missing) > 0 {
		return fmt.Errorf("以下必填配置缺失: %s", strings.Join(missing, ", "))
	}
	return nil
}
