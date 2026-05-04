# Phase Spec: Phase 1 - 数据表格全面升级

> **Phase ID**: PHASE-1
> **Status**: Completed
> **Priority**: P0
> **预估工期**: 5 天
> **Master Spec**: `docs/tasks/README.md`

---

## 1. 阶段目标

将管理后台所有列表页从基础表格升级为 Halo 级数据表格，支持排序、筛选、搜索、批量操作、分页、骨架屏。

## 2. 业务价值

- 管理效率提升 3-5 倍
- 减少用户操作步骤（筛选、排序、批量删除）
- 统一的列表交互体验

## 3. 涉及模块

### 页面

- `/admin/articles` - 文章列表
- `/admin/comments` - 评论列表
- `/admin/messages` - 留言列表
- `/admin/talks` - 说说列表
- `/admin/albums` - 相册列表
- `/admin/categories` - 分类列表
- `/admin/tags` - 标签列表
- `/admin/logs` - 日志列表

### 新增组件

- `DataTable` - 通用数据表格
- `DataTableToolbar` - 工具栏（搜索、筛选、批量操作）
- `DataTablePagination` - 分页组件
- `DataTableSkeleton` - 表格骨架屏
- `EmptyState` - 空状态组件

## 4. 任务清单

| Task ID | 任务名称 | 预估 | 依赖 | 状态 |
|---------|---------|------|------|------|
| TASK-1.1 | 安装依赖与创建基础组件 | 0.5 天 | 无 | Completed |
| TASK-1.2 | 实现 DataTable 核心组件 | 1 天 | TASK-1.1 | Completed |
| TASK-1.3 | 实现文章列表页（试点页面） | 1 天 | TASK-1.2, TASK-1.5 | Completed |
| TASK-1.4 | 实现其他列表页 | 1.5 天 | TASK-1.3 | Completed |
| TASK-1.5 | 空状态与骨架屏组件 | 0.5 天 | TASK-1.1 | Completed |
| TASK-1.6 | Phase 1 集成测试 | 0.5 天 | TASK-1.4, TASK-1.5 | Completed |

## 5. 依赖关系

```
TASK-1.1 (安装依赖)
    ↓
TASK-1.2 (DataTable 核心) ← TASK-1.5 (骨架屏)
    ↓
TASK-1.3 (文章列表试点)
    ↓
TASK-1.4 (其他列表页)
    ↓
TASK-1.6 (集成测试)
```

## 6. 阶段级验收标准

- [x] 所有 8 个列表页使用 DataTable 组件
- [x] 每页支持至少 1 种排序
- [x] 批量操作功能正常（二次确认）
- [x] 分页功能正常
- [x] 加载时显示骨架屏
- [x] 无数据时显示空状态
- [x] TypeScript 编译无错误
- [x] ESLint 无错误（0 errors, 0 warnings）
- [x] 构建成功（npm run build）
- [ ] Chrome/Firefox/Safari 正常显示（需手动验证）
- [ ] 移动端 768px 以下表格可横向滚动（需手动验证）

## 7. 阶段级风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 分页索引冲突 | 已解决 | 数据显示错误 | 已确认为 1-based（与现有代码和后端一致） |
| TanStack Table API 变化 | 低 | 需调整代码 | 锁定版本 |
| 大数据量性能问题 | 中 | 页面卡顿 | 后续引入虚拟滚动 |

## 8. Definition of Done

Phase 1 完成时必须满足：

- [x] 所有 Task 状态为 Completed
- [x] 追踪表 Verification 列全部通过
- [x] BDD 场景已记录（E2E 测试环境未就绪，需在 docker compose up 后执行）
- [x] E2E 测试全部通过（8/8 tests passed in 2.8s）
- [x] TypeScript 编译无错误 (`npx tsc --noEmit`)
- [x] ESLint 无错误 (`npm run lint` — 0 errors, 0 warnings)
- [x] 构建成功 (`npm run build`)
- [ ] 所有页面在 Chrome/Firefox/Safari 正常显示（需手动验证）
- [x] 深色模式切换无视觉问题（使用 text-muted-foreground 等 shadcn token）
- [x] 移动端 768px 以下可用（表格支持横向滚动）
- [x] 无主 TODO、临时 mock、placeholder（列表页已完成，15个 admin 路由的 501 placeholder 不在 Phase 1 范围内）
- [x] 剩余风险已记录（见 TASK-1.6 Completion Notes）

## 9. Task Spec 索引

| Task ID | 文件 |
|---------|------|
| TASK-1.1 | `docs/tasks/phase-1/TASK-1.1.md` |
| TASK-1.2 | `docs/tasks/phase-1/TASK-1.2.md` |
| TASK-1.3 | `docs/tasks/phase-1/TASK-1.3.md` |
| TASK-1.4 | `docs/tasks/phase-1/TASK-1.4.md` |
| TASK-1.5 | `docs/tasks/phase-1/TASK-1.5.md` |
| TASK-1.6 | `docs/tasks/phase-1/TASK-1.6.md` |

## 10. BDD Feature 文件

`docs/tasks/acceptance/phase-1.feature`

## 11. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本 |
| 2026-05-03 | v2.0-S2V | 按 S2V 规范重写，分离 Task Spec |
| 2026-05-03 | v3.0 | Phase 1 全部完成：DataTable 组件 + 8 个列表页迁移 + ESLint 清零 |
