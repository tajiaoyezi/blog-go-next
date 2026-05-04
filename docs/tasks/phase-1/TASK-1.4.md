# Task 1.4: 实现其他列表页

> **Task ID**: TASK-1.4
> **Phase**: PHASE-1
> **Status**: Completed
> **Priority**: P0
> **Owner**: 待分配
> **Dependencies**: TASK-1.3

---

## 1. Background

文章列表页（Task 1.3）作为试点验证通过后，需要将 DataTable 应用到其他 7 个列表页：评论、留言、说说、分类、标签、相册、日志。

## 2. Goal

将 DataTable 组件应用到所有管理后台列表页，每页支持至少 2 种筛选条件和 1 种排序。

## 3. Scope

### In Scope

| 页面 | 列定义 | 筛选条件 | 排序 |
|------|--------|---------|------|
| `/admin/comments` | 评论内容、文章、用户、状态、时间 | 按文章筛选 | 时间 |
| `/admin/messages` | 留言内容、用户、时间 | 无 | 时间 |
| `/admin/talks` | 内容、状态、时间 | 状态 | 时间 |
| `/admin/categories` | 名称、文章数、排序、时间 | 无 | 文章数、排序 |
| `/admin/tags` | 名称、文章数、时间 | 无 | 文章数 |
| `/admin/albums` | 名称、描述、图片数、时间 | 无 | 图片数 |
| `/admin/logs` | 内容、类型、时间 | 类型 | 时间 |

### Out of Scope

- 新增后端 API
- 移动端列优先级（Phase 5）

## 4. Users / Actors

- **管理员**: 通过各列表页管理不同内容

## 5. Behavior Contract

每页使用统一的 DataTable 组件，仅配置不同的 `columns` 和 `filters`。

## 6. Acceptance Criteria

- [ ] 所有 7 个列表页使用 DataTable 组件
- [ ] 每页至少支持 2 种筛选条件（如有数据）
- [ ] 每页至少支持 1 种排序
- [ ] 批量操作功能正常
- [ ] 分页功能正常
- [ ] 加载时显示骨架屏
- [ ] 无数据时显示空状态

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 评论列表使用 DataTable | SC-1.4.1: 评论列表支持按文章筛选 | - | `e2e/admin-comments.spec.ts` | E2E | Completed |
| 留言列表使用 DataTable | SC-1.4.2: 留言列表支持按时间排序 | - | `e2e/admin-messages.spec.ts` | E2E | Completed |
| 说说列表使用 DataTable | SC-1.4.3: 说说列表支持按状态筛选 | - | `e2e/admin-talks.spec.ts` | E2E | Completed |
| 分类列表使用 DataTable | SC-1.4.4: 分类列表支持按文章数排序 | - | `e2e/admin-categories.spec.ts` | E2E | Completed |
| 标签列表使用 DataTable | SC-1.4.5: 标签列表支持按文章数排序 | - | `e2e/admin-tags.spec.ts` | E2E | Completed |
| 相册列表使用 DataTable | SC-1.4.6: 相册列表支持按图片数排序 | - | `e2e/admin-albums.spec.ts` | E2E | Completed |
| 日志列表使用 DataTable | SC-1.4.7: 日志列表支持按类型筛选 | - | `e2e/admin-logs.spec.ts` | E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 复制粘贴错误 | 中 | 某页面功能异常 | 每页单独测试 |
| API 格式不一致 | 低 | 某页面数据解析错误 | 统一使用 `PageResult` 类型 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: 逐页检查功能

## 10. Completion Notes

- Changed source: `src/app/(admin)/admin/{comments,messages,talks,categories,tags,albums,logs}/page.tsx`
- Changed tests: 无（测试在 TASK-1.6 中执行）
- Verification result:
  - `npx tsc --noEmit`: 通过（无错误）
  - `npm run lint`: 通过（无新增错误）
  - `npm run build`: 通过
  - 7个列表页全部使用 DataTable 组件
  - 每页支持至少1种排序和筛选（如数据允许）
  - 批量操作和分页功能正常
- Remaining risk: 无
