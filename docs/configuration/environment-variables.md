# 环境变量 | Environment Variables

Blog Go Next 支持通过环境变量完全覆盖配置文件。所有配置项都可通过环境变量注入。

## 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `JWT_SECRET` | JWT 签名密钥，**必须 ≥ 32 字符** | `openssl rand -base64 48` |

> ⚠️ **重要**: 没有设置 `JWT_SECRET` 时，`docker compose config` 会直接拒绝启动。

## 数据库配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_HOST` | PostgreSQL 主机 | `localhost` |
| `DATABASE_PORT` | PostgreSQL 端口 | `5432` |
| `DATABASE_USER` | 数据库用户名 | `blog` |
| `DATABASE_PASSWORD` | 数据库密码 | `blog123` |
| `DATABASE_NAME` | 数据库名称 | `blog` |
| `DATABASE_SSLMODE` | SSL 模式 | `disable` |

## Redis 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `REDIS_ADDR` | Redis 地址 | `localhost:6379` |
| `REDIS_PASSWORD` | Redis 密码 | ``（空） |
| `REDIS_DB` | Redis 数据库编号 | `0` |

## RabbitMQ 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `RABBITMQ_URL` | 连接 URL | `amqp://guest:guest@localhost:5672/` |

## Elasticsearch 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ELASTICSEARCH_ADDRESSES` | ES 地址 | `http://localhost:9200` |

## 后端服务配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SERVER_PORT` | HTTP 服务端口 | `8080` |
| `SERVER_MODE` | 运行模式 | `release` |
| `AUTO_MIGRATE_ON_STARTUP` | 启动时自动迁移 | `true` |
| `LOG_LEVEL` | 日志级别 | `info` |

## 前端配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_BASE` | API 基础路径（编译进 bundle） | `/api/v1` |
| `BACKEND_URL` | Next.js 反代目标（仅服务端） | `http://localhost:8080` |

## 邮件配置（可选）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SMTP_HOST` | SMTP 服务器地址 | - |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | - |
| `SMTP_PASSWORD` | SMTP 密码 | - |
| `SMTP_FROM` | 发件人地址 | - |

## OAuth 配置（可选）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OAUTH_QQ_CLIENT_ID` | QQ OAuth Client ID | - |
| `OAUTH_QQ_CLIENT_SECRET` | QQ OAuth Client Secret | - |
| `OAUTH_WEIBO_CLIENT_ID` | 微博 OAuth Client ID | - |
| `OAUTH_WEIBO_CLIENT_SECRET` | 微博 OAuth Client Secret | - |

## 文件存储配置（可选）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `STORAGE_TYPE` | 存储类型：local/oss/cos | `local` |
| `STORAGE_LOCAL_PATH` | 本地存储路径 | `./uploads` |
| `STORAGE_OSS_ENDPOINT` | 阿里云 OSS Endpoint | - |
| `STORAGE_OSS_BUCKET` | 阿里云 OSS Bucket | - |
| `STORAGE_OSS_ACCESS_KEY` | 阿里云 Access Key | - |
| `STORAGE_OSS_SECRET_KEY` | 阿里云 Secret Key | - |

## Seed 配置（首次部署）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SEED_ADMIN_EMAIL` | 管理员邮箱 | - |
| `SEED_ADMIN_PASSWORD` | 管理员密码（≥8 字符） | - |

## 命名规则

配置文件使用点号分隔（如 `database.host`），环境变量将点号替换为下划线并大写：

```yaml
# config.yaml
database:
  host: localhost
  port: 5432
```

等价于：

```bash
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
```

## .env 文件示例

```bash
# 必需
JWT_SECRET=your-super-secret-key-at-least-32-chars-long

# 数据库（Docker 开发使用默认值即可）
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=blog
DATABASE_PASSWORD=blog123
DATABASE_NAME=blog

# Redis
REDIS_ADDR=redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# Elasticsearch
ELASTICSEARCH_ADDRESSES=http://elasticsearch:9200

# 前端
NEXT_PUBLIC_API_BASE=/api/v1
BACKEND_URL=http://backend:8080

# 首次部署种子
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your-strong-password
```

## 下一步

- [快速开始](../getting-started/quick-start.md)
- [本地开发](../getting-started/local-development.md)
- [故障排查](../guides/troubleshooting.md)
