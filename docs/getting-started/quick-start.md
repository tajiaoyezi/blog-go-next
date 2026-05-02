# 快速开始 | Quick Start

使用 Docker Compose 在 5 分钟内启动完整的 Blog Go Next 系统。

## 环境要求

- Docker Engine 24.0+
- Docker Compose v2
- 可用端口：3000, 8080, 5432, 6379, 5672, 15672, 9200

## 一键启动

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/blog-go-next.git
cd blog-go-next

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env，至少设置 JWT_SECRET（推荐: openssl rand -base64 48）

# 3. 启动全部服务
docker compose up --build -d
```

服务启动顺序：PostgreSQL → Redis → RabbitMQ → Elasticsearch → Backend → Frontend

## 初始化管理员账号

首次部署需要创建管理员账号：

```bash
docker compose exec backend \
  env SEED_ADMIN_EMAIL="admin@example.com" \
      SEED_ADMIN_PASSWORD="your-strong-password" \
  ./seed
```

> 密码必须 ≥ 8 字符。`cmd/seed` 是幂等的，若已存在账号则跳过。

## 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| 博客前台 | http://localhost:3000 | 公开访问 |
| 管理后台 | http://localhost:3000/admin/login | 需登录 |
| RabbitMQ 管理面板 | http://localhost:15672 | guest/guest |

## 停止服务

```bash
docker compose down
```

如需删除数据卷（**会清空数据库**）：

```bash
docker compose down -v
```

## 下一步

- [本地开发配置](./local-development.md)
- [系统架构](../architecture/overview.md)
- [环境变量参考](../configuration/environment-variables.md)
