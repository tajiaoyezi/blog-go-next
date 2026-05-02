# 本地开发 | Local Development

不通过 Docker 运行完整应用，适合日常开发和调试。

## 环境要求

- Go 1.21+
- Node.js 18+ / npm 9+
- Docker（仅用于运行基础设施）

## 1. 启动基础设施

```bash
# 在项目根目录
docker compose up -d postgres redis rabbitmq elasticsearch
```

这只会启动 PostgreSQL、Redis、RabbitMQ 和 Elasticsearch，不会启动前后端服务。

## 2. 后端开发

```bash
cd backend

# 设置必要的环境变量
export JWT_SECRET="your-random-secret-at-least-32-chars"

# 首次：执行数据库迁移
go run ./cmd/migrate

# 首次：创建管理员账号
SEED_ADMIN_EMAIL="admin@example.com" \
SEED_ADMIN_PASSWORD="your-strong-password" \
go run ./cmd/seed

# 启动后端服务
go run ./cmd/server
```

后端服务将运行在 http://localhost:8080

### 后端开发常用命令

```bash
# 格式化代码
go fmt ./...

# 静态分析
go vet ./...

# 运行测试
go test -race ./...

# 编译二进制
go build -o ./bin/server ./cmd/server/
```

## 3. 前端开发

```bash
cd frontend
npm install

# 非 Docker 开发时，直连本地后端
echo 'BACKEND_URL=http://localhost:8080' > .env.local

npm run dev
```

前端开发服务器运行在 http://localhost:3000

### 前端开发常用命令

```bash
# 类型检查
npx tsc --noEmit

# ESLint 检查
npx eslint src/

# 生产构建
npm run build
```

## 4. 验证环境

```bash
# 检查后端健康
curl http://localhost:8080/health

# 检查前端
curl http://localhost:3000
```

## 5. 推荐开发工作流

1. 启动基础设施（只需一次）
2. 启动后端（终端 1）
3. 启动前端（终端 2）
4. 修改代码，热重载自动生效

## 常见问题

**Q: 端口被占用？**

修改 `docker-compose.yml` 中的端口映射，或停止占用端口的本地服务。

**Q: 前端请求 502？**

确保后端已启动，且 `.env.local` 中的 `BACKEND_URL` 指向正确地址。

**Q: 数据库连接失败？**

检查 PostgreSQL 容器是否运行：`docker compose ps postgres`

## 下一步

- [系统架构](../architecture/overview.md)
- [环境变量配置](../configuration/environment-variables.md)
- [故障排查](../guides/troubleshooting.md)
