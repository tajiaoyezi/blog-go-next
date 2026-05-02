# Blog Go Next

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/Go-1.21%2B-00ADD8?logo=go" alt="Go">
  <img src="https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/Docker-24%2B-2496ED?logo=docker" alt="Docker">
</p>

<p align="center">
  <b>Go + Next.js 全栈博客系统</b>
  <br>
  快速 · 现代 · 易部署
</p>

<p align="center">
  <a href="#-features">功能特性</a> ·
  <a href="#-quick-start">快速开始</a> ·
  <a href="#-architecture">架构图</a> ·
  <a href="#-documentation">文档</a> ·
  <a href="#-contributing">贡献</a>
</p>

---

## 项目简介

Go + Next.js 全栈博客系统，重构自 [SpringBoot + Vue 博客项目](https://github.com/tajiaoyezi/blog)。

采用现代技术栈重构，后端使用 Go 1.21+ + Gin 框架提供高性能 API，前端使用 Next.js 15 + React 19 提供现代化管理后台和流畅的用户体验。支持 Docker 一键部署，5 分钟内即可运行完整的博客平台。

## 截图展示

> 将截图放入 `screenshots/` 目录可自动展示

| 博客首页 | 文章详情 | 管理后台 |
|---------|---------|---------|
| ![博客首页](blog-home.png) | ![文章详情](blog-article-detail.png) | ![管理后台](admin-dashboard.png) |

| 文章管理 | Markdown 编辑器 | 分类标签 |
|---------|----------------|---------|
| ![文章管理](admin-articles.png) | ![编辑器](admin-editor.png) | ![分类标签](admin-tags.png) |

## 功能特性

### 博客功能
- ✍️ **Markdown 文章编辑** - 支持富文本编辑、代码高亮、图片上传
- 📚 **分类与标签** - 灵活的内容组织方式
- 🔍 **Elasticsearch 全文搜索** - 快速搜索文章内容
- 📅 **归档系统** - 按时间线组织历史文章
- 👆 **置顶文章** - 重要内容突出显示

### 互动功能
- 💬 **评论系统** - 树形评论，支持回复
- 🗣️ **留言板** - 弹幕式留言互动
- 💭 **说说** - 微博式短内容分享
- 💬 **WebSocket 聊天室** - 实时聊天功能

### 媒体管理
- 🖼️ **相册管理** - 图片上传、分类、预览
- 📤 **多存储后端** - 支持本地/OSS/COS
- 📷 **文件上传** - MIME 检测 + 扩展名白名单

### 用户与权限
- 🔐 **JWT 认证** - 6 小时有效期，支持主动撤销
- 🛡️ **RBAC 权限** - 基于 Casbin 的细粒度权限控制
- 👥 **OAuth 登录** - QQ/微博第三方登录
- ✉️ **邮箱验证** - 注册/找回密码邮箱验证

### 管理后台
- 📊 **仪表盘** - 访问统计、数据可视化
- 📝 **操作日志** - 完整的管理操作记录
- ⚙️ **系统配置** - 站点信息、SEO 配置
- 🔄 **自动迁移** - 启动时自动数据库迁移

## 技术栈

### 后端
- **Go 1.21+** + Gin（HTTP 框架）
- **GORM** + PostgreSQL 16（ORM 与数据库）
- **JWT** + Casbin（认证与 RBAC 权限）
- **Redis 7**（缓存、点赞计数、验证码、限流）
- **RabbitMQ 3.13**（异步邮件、CDC 同步）
- **Elasticsearch 7**（全文搜索）
- **gorilla/websocket**（聊天室）

### 前端
- **Next.js 15** + React 19 + TypeScript
- **TailwindCSS v4** + shadcn/ui
- **Zustand**（状态管理）
- **Recharts**（图表）
- **@uiw/react-md-editor**（Markdown 编辑器）

## 快速开始

### 环境要求

- Go 1.21+
- Node.js 18+
- Docker + Docker Compose

### 30 秒启动

```bash
# 1. 克隆并进入项目
git clone https://github.com/yourusername/blog-go-next.git
cd blog-go-next

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env，至少设置 JWT_SECRET（推荘 openssl rand -base64 48）

# 3. 启动全部服务
docker compose up --build -d
```

### 初始化管理员

首次部署需要创建管理员账号：

```bash
docker compose exec backend \
  env SEED_ADMIN_EMAIL="admin@example.com" \
      SEED_ADMIN_PASSWORD="your-strong-password" \
  ./seed
```

### 访问服务

| 服务 | 地址 |
|------|------|
| 博客前台 | http://localhost:3000 |
| 管理后台 | http://localhost:3000/admin/login |
| RabbitMQ 管理 | http://localhost:15672 (guest/guest) |

> 详细部署文档见 [docs/getting-started/quick-start.md](docs/getting-started/quick-start.md)

## 系统架构

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15 / :3000)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  博客前台  │  │  管理后台  │  │  通用组件  │   │
│  │  (blog)   │  │  (admin)  │  │ (ui/lib) │   │
│  └────────────┘  └────────────┘  └────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              API Gateway (Next.js API Routes)                    │
│                   /api/* → proxy → backend:8080                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Backend (Go 1.21+ / :8080)                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  HTTP Handler (Gin) → Service → Repository → GORM │  │
│  │  Middleware: Logger → Recovery → CORS → JWT → RBAC  │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
          │              │              │
          ▼              ▼              ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │PostgreSQL│    │  Redis   │    │ RabbitMQ │
   │   5432   │    │   6379   │    │  5672   │
   └─────────┘    └─────────┘    └─────────┘
          │
          ▼
   ┌─────────┐
   │Elasticsearch│
   │    9200    │
   └─────────┘
```

## 文档

详细文档请访问 [docs/](docs/) 目录：

| 文档 | 说明 |
|------|------|
| [快速开始](docs/getting-started/quick-start.md) | Docker Compose 一键启动 |
| [本地开发](docs/getting-started/local-development.md) | 非 Docker 开发环境配置 |
| [架构概览](docs/architecture/overview.md) | 系统架构设计 |
| [环境变量](docs/configuration/environment-variables.md) | 完整配置参考 |
| [常见问题](docs/guides/faq.md) | FAQ |
| [故障排查](docs/guides/troubleshooting.md) | 常见错误解决方法 |

## 项目结构

```
blog-go-next/
├─── backend/                # Go 后端
│   ├─── cmd/
│   │   ├─── server/         # 主服务入口
│   │   ├─── migrate/        # 手动执行 schema 迁移
│   │   └─── seed/           # 首次部署创建管理员
│   ├─── internal/
│   │   ├─── config/         # 配置 + 数据库/Redis 初始化
│   │   ├─── model/          # GORM 模型（23 张表）
│   │   ├─── handler/        # HTTP handler + 路由
│   │   ├─── service/        # 业务逻辑
│   │   ├─── repository/     # 通用数据访问
│   │   ├─── middleware/     # JWT/RBAC/限流
│   │   └─── pkg/            # 工具包
│   └─── config.yaml         # 配置模板
├─── frontend/               # Next.js 前端
│   └─── src/
│       ├─── app/(blog)/     # 前台博客页面
│       ├─── app/(admin)/    # 后台管理页面
│       ├─── components/     # 共享组件
│       ├─── lib/            # API 封装 + 共享类型
│       ├─── hooks/          # 自定义 hooks
│       └─── stores/         # Zustand stores
├─── docker-compose.yml      # 开发/演示环境
├─── .env.example            # 环境变量模板
├─── docs/                   # 项目文档
├─── .github/                # GitHub 模板
└─── README.md
```

## 生产部署建议

### 关闭启动时自动迁移（多副本）

滚动部署时多个副本会同时尝试抢 schema 锁，容易导致启动卡死。改为：

```bash
# CI/CD 中先跑一次迁移
docker compose exec backend ./migrate

# 服务本身启动时跳过
AUTO_MIGRATE_ON_STARTUP=false docker compose up -d backend
```

### 环境变量完全覆盖 YAML

`config.yaml` 不存在时服务不再 `Fatal`，所有配置项都能通过环境变量注入：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥（≥32 字符，**必填**） | 无 |
| `AUTO_MIGRATE_ON_STARTUP` | 是否启动时自动迁移 | true |
| `DATABASE_HOST` / `DATABASE_PORT` / ... | 数据库连接参数 | - |
| `REDIS_ADDR` | Redis 地址 | localhost:6379 |
| `RABBITMQ_URL` | RabbitMQ 连接 URL | amqp://guest:guest@localhost:5672/ |
| `ELASTICSEARCH_ADDRESSES` | ES 地址 | http://localhost:9200 |
| `NEXT_PUBLIC_API_BASE` | 前端 API 基础路径 | /api/v1 |
| `BACKEND_URL` | Next 反代目标 | http://localhost:8080 |

配置项使用点号分隔时，环境变量将点号替换为下划线（例如 `database.host` → `DATABASE_HOST`）。

## 本地开发（非 Docker）

### 后端

```bash
cd backend

# 启动基础设施（只起 postgres/redis/mq/es）
docker compose up -d postgres redis rabbitmq elasticsearch

export JWT_SECRET="your-random-secret-at-least-32-chars"

# 首次：生成 schema + 种子数据
go run ./cmd/migrate

# 首次：创建管理员
SEED_ADMIN_EMAIL="admin@example.com" \
SEED_ADMIN_PASSWORD="your-strong-password" \
go run ./cmd/seed

# 启动服务
go run ./cmd/server
```

### 前端

```bash
cd frontend
npm install
# 非 Docker 开发时，直连本地后端
echo 'BACKEND_URL=http://localhost:8080' > .env.local
npm run dev
```

前端默认端口 3000。

## E2E 测试

项目使用 Playwright 进行端到端测试，已通过 35 个测试用例：

```bash
cd frontend
npx playwright test
```

## 贡献

感谢所有贡献者！请查阅 [贡献指南](CONTRIBUTING.md) 了解如何参与项目。

## Star 历史

> 可使用 [Star History](https://star-history.com/) 生成 star 趋势图

## License

[MIT](LICENSE) © Blog Go Next Contributors
