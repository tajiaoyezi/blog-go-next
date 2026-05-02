# 贡献指南 | Contributing Guide

**中文** | [English](#english)

感谢您对 Blog Go Next 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 报告 Bug
- 提交功能请求
- 改进文档
- 提交代码（修复、新功能、重构）
- 分享使用经验

## 开发环境

- **Go** 1.21+
- **Node.js** 18+ / npm 9+
- **Docker** + Docker Compose v2

## 快速开始

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/blog-go-next.git
cd blog-go-next

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env，设置 JWT_SECRET（推荐 openssl rand -base64 48）

# 3. 启动全部服务
docker compose up --build -d

# 4. 创建管理员账号（首次部署）
docker compose exec backend \
  env SEED_ADMIN_EMAIL="admin@example.com" \
      SEED_ADMIN_PASSWORD="your-strong-password" \
  ./seed

# 5. 访问
# 博客前台: http://localhost:3000
# 管理后台: http://localhost:3000/admin/login
```

## 代码规范

### 前端 (Next.js / TypeScript)

```bash
cd frontend
npm install

# 类型检查（必须零错误）
npx tsc --noEmit

# ESLint 检查
npx eslint src/

# 开发服务器
npm run dev
```

- 使用 TypeScript **严格模式**（`strict: true`）
- 优先使用函数组件 + Hooks
- 状态管理优先使用 Zustand
- UI 组件优先使用 shadcn/ui
- API 调用统一封装在 `src/lib/api.ts`

### 后端 (Go)

```bash
cd backend

# 静态分析
go vet ./...

# 运行测试（含竞态检测）
go test -race ./...

# 格式化
go fmt ./...
```

- 遵循 [Effective Go](https://go.dev/doc/effective_go) 和 [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- 使用 `gofmt` / `goimports` 自动格式化
- 所有导出符号必须有文档注释
- 错误处理必须明确，禁止裸 `panic`
- HTTP handler 统一使用 `response.OK()` / `response.Fail*()` 返回

## 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

```
<type>(<scope>): <subject>

<body>

<footer>
```

**常用类型：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链更新 |

**示例：**

```
feat(article): add Elasticsearch full-text search

Implement article search using Elasticsearch with ik_max_word analyzer.
Supports keyword highlighting and pagination.

Closes #123
```

## PR 检查清单

在提交 Pull Request 前，请确认：

- [ ] 代码已通过 `go vet ./...` 和 `go test -race ./...`（后端）
- [ ] 代码已通过 `npx tsc --noEmit` 和 `npx eslint src/`（前端）
- [ ] 新功能包含测试用例
- [ ] 文档已同步更新
- [ ] Commit 信息符合 Conventional Commits 规范
- [ ] PR 描述清楚说明了改动内容和原因
- [ ] 没有引入不必要的依赖

## Issue 报告

报告 Bug 时，请提供：

1. **环境信息**：Go 版本、Node 版本、操作系统、Docker 版本
2. **复现步骤**：最小可复现的操作序列
3. **预期行为** vs **实际行为**
4. **相关日志**：后端日志、浏览器控制台日志
5. **截图**：如有 UI 问题，请附截图

功能请求请描述：

1. **使用场景**：这个功能解决什么问题
2. **预期行为**：具体的功能描述
3. **替代方案**：您考虑过哪些替代实现

## 安全报告

请勿在公开 Issue 中报告安全漏洞。请参考 [SECURITY.md](./SECURITY.md) 中的安全报告流程。

---

<a name="english"></a>

## English

Thank you for your interest in Blog Go Next! We welcome all forms of contributions.

## Development Environment

- **Go** 1.21+
- **Node.js** 18+ / npm 9+
- **Docker** + Docker Compose v2

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/blog-go-next.git
cd blog-go-next

# 2. Prepare environment
cp .env.example .env
# Edit .env, set JWT_SECRET (recommended: openssl rand -base64 48)

# 3. Start all services
docker compose up --build -d

# 4. Create admin account (first time only)
docker compose exec backend \
  env SEED_ADMIN_EMAIL="admin@example.com" \
      SEED_ADMIN_PASSWORD="your-strong-password" \
  ./seed
```

## Code Standards

### Frontend (Next.js / TypeScript)

```bash
cd frontend
npm install
npx tsc --noEmit      # Must pass with zero errors
npx eslint src/       # Lint check
npm run dev           # Dev server
```

- TypeScript **strict mode** required
- Prefer function components + Hooks
- Use Zustand for state management
- Use shadcn/ui for UI components

### Backend (Go)

```bash
cd backend
go vet ./...
go test -race ./...
go fmt ./...
```

- Follow [Effective Go](https://go.dev/doc/effective_go)
- All exported symbols must have documentation comments
- Explicit error handling, no bare `panic`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

## PR Checklist

- [ ] Backend passes `go vet ./...` and `go test -race ./...`
- [ ] Frontend passes `npx tsc --noEmit` and `npx eslint src/`
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Commits follow Conventional Commits
- [ ] PR description clearly explains changes

## Security Reporting

Please do not report security vulnerabilities in public issues. See [SECURITY.md](./SECURITY.md) for the security reporting process.
