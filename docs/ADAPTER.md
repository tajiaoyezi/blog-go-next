# Project Development Adapter｜blog-go-next

## Project

- Name: `blog-go-next`
- Type: `Web` (Full-stack blog system)
- Primary users / actors: `博主/管理员 (Admin), 访客 (Visitor)`
- Critical workflows: `文章发布与管理, 评论审核, 站点配置, 媒体管理`

## Specification Locations

- SDD home: `docs/tasks/`
- Master spec: `docs/tasks/README.md`
- Phase spec pattern: `docs/tasks/phase-{N}/README.md`
- Task spec pattern: `docs/tasks/phase-{N}/README.md#Task-X.X`
- BDD acceptance home: `docs/tasks/acceptance/`
- ADR home: `docs/tasks/decisions/`

## Source And Test Areas

- Source areas: `frontend/src/, backend/internal/`
- Unit test areas: `frontend/src/**/__tests__/, backend/**/*_test.go`
- Integration test areas: `frontend/e2e/`
- E2E test areas: `frontend/e2e/`

## Commands

- Lint: `cd frontend && npm run lint`
- Typecheck: `cd frontend && npx tsc --noEmit`
- Unit tests: `cd backend && go test -race ./...` (backend only; frontend has no unit tests yet)
- Integration tests: `cd frontend && npm run test:e2e`
- E2E tests: `cd frontend && npm run test:e2e`
- Build: `cd frontend && npm run build`
- Runtime smoke: `docker compose up --build -d`
- Release / Deploy: `docker compose up -d`

## Constraints

- Runtime target: `Docker Compose (Next.js 16 + Go 1.22 + PostgreSQL 16 + Redis 7 + RabbitMQ 3.13 + Elasticsearch 7.17)`
- Supported platforms: `Modern browsers (Chrome 120+, Firefox 120+, Safari 17+), Node.js 20+, macOS/Linux development`
- Security requirements: `JWT Bearer token auth (6h expiry), RBAC via Casbin, password ≥ 8 chars, rate limiting on auth endpoints`
- Performance requirements: `首屏加载 < 2s (4G), 表格页切换 < 300ms, 图片懒加载, 服务端渲染优先`
- Compatibility requirements: `保持现有 API 响应格式 {code, flag, message, data}, 分页索引与后端一致`
- Release constraints: `无特殊发布窗口约束, 支持 Docker 独立部署`
