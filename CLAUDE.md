# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack blog system rewritten from Spring Boot + Vue to **Go (Gin) + Next.js (App Router)**. Monorepo with `backend/` and `frontend/` directories.

## Build & Run Commands

### Docker (recommended)

```bash
docker compose up --build -d    # Build and start everything
docker compose down              # Stop all services
docker compose logs backend -f   # Tail backend logs
```

### Backend (Go)

```bash
cd backend
go build -o ./bin/server ./cmd/server/   # Compile
JWT_SECRET="your-secret-32chars-min" ./bin/server  # Run (requires infra running)
go vet ./...                              # Static analysis
go test -race ./...                       # Tests with race detection
```

Config loaded from `config.yaml` (override with `CONFIG_PATH` env var). Docker uses `config.docker.yaml` which references container hostnames instead of localhost.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev          # Dev server on :3000
npm run build        # Production build (output: standalone)
npx tsc --noEmit     # Type check
npx eslint src/      # Lint
```

`NEXT_PUBLIC_API_BASE` defaults to `http://localhost:8080/api/v1`.

## Architecture

### Backend Layers

```
HTTP → Handler (validation, param parsing) → Service (business logic) → GORM → PostgreSQL
                                                                      → Redis (cache/stats)
                                                                      → RabbitMQ (async email, CDC)
                                                                      → Elasticsearch (search)
```

- **Handlers** (`internal/handler/`): Parse request, call service, return `response.OK(c, data)` or `response.Fail*(c, msg)`.
- **Services** (`internal/service/`): Business logic. Constructed with `NewXxxService(db *gorm.DB)`.
- **Repository** (`internal/repository/`): Generic `BaseRepository[T]` for CRUD.
- **Models** (`internal/model/`): GORM models for 23 tables. All extend `BaseModel` (ID, CreateTime, UpdateTime).

### Dependency Injection

All services and handlers are instantiated in `main.go` and wired into `handler.Deps` struct, which is passed to `SetupRouter()`.

### Middleware Chain

`Logger → Recovery → CORS → InjectDB → [JWTAuth] → [RBACAuth]`

- JWT: 6-hour expiry, claims contain UserID/UserInfoID/Username. Secret must be ≥32 chars.
- RBAC: Casbin with `gorm-adapter/v3`. Admin role bypasses all checks.

### Router Structure

```
/health                         → Health check
/api/v1/                        → Public (articles, categories, tags, talks, links, messages, config)
/api/v1/ [JWTAuth]              → Authenticated (like, comment, update password)
/api/v1/admin/ [JWTAuth+RBAC]   → Admin CRUD for all resources
```

15 placeholder routes exist for user/role/menu/resource management (return 501).

### Frontend Structure

```
src/app/
  (blog)/     → Public pages: home, archives, categories, tags, talks, links, message, about
  (admin)/    → Admin: login, dashboard, article editor, CRUD for all entities
src/lib/api.ts      → Fetch wrapper with token injection, timeout (GET only), error parsing
src/stores/auth.ts  → Zustand persist store with _hydrated flag for SSR safety
src/components/ui/  → shadcn/ui components
```

Admin layout waits for Zustand rehydration before checking auth to prevent flash-redirect on refresh.

## API Response Format

All endpoints return:
```json
{"code": 20000, "flag": true, "message": "操作成功", "data": ...}
```

Codes: `20000` success, `40001` unauthorized, `40003` forbidden, `40010` validation error, `50000` server error.

## Key Conventions

- **DELETE endpoints** accept `[]int` JSON body for batch deletion (not path params), except `DELETE /admin/albums/:id`.
- **SaveOrUpdate pattern**: POST creates or updates based on whether `id` is present in body. PUT on articles is soft-delete, not update.
- **Soft delete**: Articles use `is_delete` boolean flag, not GORM's `DeletedAt`.
- **Tag association**: `HomeArticleVO.TagVOList` must have `gorm:"-"` tag — filled manually after query to avoid GORM auto-association errors.
- **Frontend API client**: Reads token from Zustand store (persisted to localStorage; single source of truth).
- **Model validation**: Use `binding:"required"` on model fields that handlers bind with `ShouldBindJSON`.

## Infrastructure

| Service | Container | Port | Notes |
|---------|-----------|------|-------|
| PostgreSQL 16 | blog-postgres | 5432 | User: blog, Pass: blog123, DB: blog |
| Redis 7 | blog-redis | 6379 | No password |
| RabbitMQ 3.13 | blog-rabbitmq | 5672/15672 | guest/guest, management UI on 15672 |
| Elasticsearch 7.17 | blog-elasticsearch | 9200 | Single-node, no security. IK analyzer not installed. |

## Bootstrap

启动流程已解耦为独立命令（不再随应用自动执行）：

```bash
# 首次部署：建表 + 初始化数据
./bin/migrate                                              # schema 迁移
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=xxxxx \
  ./bin/seed                                                # 创建管理员 + 角色 + 页面
./bin/reindex                                              # 全量重建 ES 文章索引

# 日常启动
./bin/server
```

- `model.Seed()` 现在只 seed 角色和页面，**不再创建默认管理员**
- 管理员必须通过 `cmd/seed` 显式创建（读 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` 环境变量，密码 ≥ 8 字符）
- 启动期仍会跑 `AutoMigrate`；多副本部署建议设 `AUTO_MIGRATE_ON_STARTUP=false` 并在 CI/CD 执行 `./bin/migrate`

## Security Posture

- **JWT_SECRET** 必须通过 `.env` 注入，`docker-compose.yml` 缺失则拒绝启动
- **JWT 撤销**：`UserAuth.TokenVersion` 字段用于主动失效；改密自动 bump token version
- **WebSocket `/chat`**：位于 auth 路由组，必须 JWT 登录；身份从 claims 派生，不接受客户端传入 userId/nickname/avatar；广播不含 IP
- **限流**：`/register` 3/min，`/login` 5/min，`/users/code` 10/hour（Redis Lua 原子脚本实现，fail-open）
- **OAuth**：`pkg/oauth` 提供 `GenerateState`/`VerifyState`，callback handler 未接入，接入时必须先 VerifyState

## Known Limitations

- Elasticsearch IK analyzer 未安装 — reindex 命令会因 mapping 所需的 `ik_max_word` 失败
- 15 个 admin 路由（users/roles/menus/resources）是 placeholder stubs，返回 501
- Upload 只做 MIME 嗅探 + 扩展名白名单，**无病毒扫描**；大图无自动压缩
