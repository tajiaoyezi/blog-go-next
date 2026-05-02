# 系统架构 | Architecture Overview

Blog Go Next 采用前后端分离架构，后端使用 Go + Gin，前端使用 Next.js 15。

## 技术栈

### 后端 (Backend)

| 组件 | 技术 | 用途 |
|------|------|------|
| HTTP 框架 | Gin | REST API 路由和处理 |
| ORM | GORM | PostgreSQL 数据访问 |
| 数据库 | PostgreSQL 16 | 主数据存储（23 张表） |
| 缓存 | Redis 7 | 缓存、计数、验证码、限流 |
| 消息队列 | RabbitMQ 3.13 | 异步邮件、CDC 同步 |
| 搜索引擎 | Elasticsearch 7 | 全文搜索 |
| 认证 | JWT + Casbin | 认证 + RBAC 权限 |
| WebSocket | gorilla/websocket | 实时聊天室 |

### 前端 (Frontend)

| 组件 | 技术 | 用途 |
|------|------|------|
| 框架 | Next.js 15 | React 全栈框架 |
| UI 库 | React 19 + TypeScript | 组件开发 |
| 样式 | TailwindCSS v4 | 原子化 CSS |
| 组件库 | shadcn/ui | 基础 UI 组件 |
| 状态管理 | Zustand | 全局状态 |
| 图表 | Recharts | 数据可视化 |
| 编辑器 | @uiw/react-md-editor | Markdown 编辑 |

## 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   博客前台    │  │   管理后台    │  │   通用组件    │      │
│  │  (blog)      │  │  (admin)     │  │  (ui/lib)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                         Next.js 15 / 3000                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      网关/代理层 (Gateway)                     │
│                     Next.js API Routes                       │
│              /api/* → proxy → backend:8080                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        后端层 (Backend)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTTP Handler (Gin)                                  │  │
│  │  ├── 参数校验、绑定                                     │  │
│  │  ├── JWT 认证 (可选)                                   │  │
│  │  └── RBAC 鉴权 (可选)                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Layer                                       │  │
│  │  ├── 业务逻辑                                          │  │
│  │  ├── 事务管理                                          │  │
│  │  └── 外部服务调用                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Repository Layer                                    │  │
│  │  └── Generic BaseRepository[T]                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Model Layer (GORM)                                  │  │
│  │  └── 23 Tables with BaseModel (ID, Create, Update)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                         Go 1.21+ / 8080                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │  RabbitMQ    │
│    5432      │    │    6379      │    │   5672       │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│Elasticsearch │
│    9200      │
└──────────────┘
```

## 请求处理流程

1. **请求进入**：Nginx/Next.js 接收 HTTP 请求
2. **路由分发**：Gin Router 根据路径分发到对应 Handler
3. **中间件链**：Logger → Recovery → CORS → InjectDB → [JWTAuth] → [RBACAuth]
4. **参数绑定**：Handler 使用 `ShouldBindJSON` 绑定请求参数
5. **业务处理**：Service 层执行业务逻辑，调用 Repository
6. **数据访问**：Repository 通过 GORM 操作数据库
7. **响应返回**：统一使用 `response.OK()` 或 `response.Fail*()` 包装响应

## 目录结构

```
blog-go-next/
├── backend/                # Go 后端
│   ├── cmd/
│   │   ├── server/         # 主服务入口
│   │   ├── migrate/        # Schema 迁移
│   │   └── seed/           # 管理员初始化
│   ├── internal/
│   │   ├── config/         # 配置管理
│   │   ├── model/          # GORM 模型（23 张表）
│   │   ├── handler/        # HTTP 处理器
│   │   ├── service/        # 业务逻辑
│   │   ├── repository/     # 数据访问层
│   │   ├── middleware/     # JWT/RBAC/限流
│   │   └── pkg/            # 工具包
│   └── config.yaml         # 配置文件
├── frontend/               # Next.js 前端
│   └── src/
│       ├── app/(blog)/     # 博客前台
│       ├── app/(admin)/    # 管理后台
│       ├── components/     # 共享组件
│       ├── lib/            # API 封装
│       ├── hooks/          # 自定义 Hooks
│       └── stores/         # Zustand 状态
├── docker-compose.yml      # 开发环境编排
├── .env.example            # 环境变量模板
└── docs/                   # 本文档
```

## 关键设计决策

### 为什么使用 Go + Next.js？

- **Go**: 高性能、低内存占用、原生并发支持，适合 API 服务
- **Next.js**: 服务端渲染、API Routes、文件路由，现代化 React 开发体验

### 为什么使用 GORM？

- 活跃维护、文档完善、支持 PostgreSQL 的高级特性
- 通用 Repository 模式减少样板代码

### 为什么使用 Zustand？

- 轻量、无样板、TypeScript 友好
- 配合 persist 中间件实现本地存储同步

## 扩展性设计

- **水平扩展**：无状态后端设计，支持多实例部署
- **数据库**：读写分离就绪，支持连接池配置
- **缓存**：Redis Cluster 支持
- **搜索**：Elasticsearch 分布式集群支持
- **文件存储**：支持本地/OSS/COS 多后端切换

## 下一步

- [环境变量配置](../configuration/environment-variables.md)
- [快速开始](../getting-started/quick-start.md)
- [故障排查](../guides/troubleshooting.md)
