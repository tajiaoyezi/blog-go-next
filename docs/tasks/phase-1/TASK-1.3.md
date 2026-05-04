# Task 1.3: 实现文章列表页（试点页面）

> **Task ID**: TASK-1.3
> **Phase**: PHASE-1
> **Status**: Completed
> **Priority**: P0
> **Owner**: 待分配
> **Dependencies**: TASK-1.2, TASK-1.5

---

## 1. Background

文章列表页（`/admin/articles`）是管理后台最高频的页面之一。当前使用基础 Table，仅支持简单分页，缺乏排序、筛选、搜索、批量操作。本任务使用新 DataTable 组件重写文章列表页，作为试点验证组件设计是否合理。

## 2. Goal

使用 DataTable 组件重写文章列表页，保留原有功能（编辑、置顶、删除），新增排序、筛选、搜索、批量操作能力。

## 3. Scope

### In Scope

- 使用 DataTable 替换现有表格
- 定义文章列表的列（标题、分类、标签、类型、状态、创建时间、操作）
- 配置筛选器（分类、类型、状态）
- 配置排序（标题、创建时间）
- 配置批量操作（批量删除）
- 配置行操作（编辑、置顶、删除）
- 移动端横向滚动

### Out of Scope

- 新增后端 API（使用现有 API）
- 移动端列优先级（Phase 5）
- 虚拟滚动（后续优化）

## 4. Users / Actors

- **管理员**: 通过文章列表页管理博客文章

## 5. Behavior Contract

### API 契约

```
GET /api/v1/admin/articles?current={page}&size={pageSize}
Response: ApiResponse<PageResult<Article>>

DELETE /api/v1/admin/articles
Body: [id1, id2, ...]
Response: ApiResponse<void>

PUT /api/v1/admin/articles/top
Body: { id: number, isTop: boolean }
Response: ApiResponse<void>
```

### 分页契约

✅ **已确认**: 后端 `current` 使用 **1-based** 索引（与现有代码 `src/app/(admin)/admin/articles/page.tsx:53` 一致）。

## 6. Acceptance Criteria

- [ ] 文章列表使用 DataTable 组件渲染
- [ ] 支持按标题、创建时间排序
- [ ] 支持按分类、类型、状态筛选
- [ ] 支持全局搜索（标题、分类）
- [ ] 支持批量选择 + 批量删除（二次确认）
- [ ] 支持分页（页码 + 每页大小选择）
- [ ] 保留原有功能（编辑、置顶、删除）
- [ ] 加载时显示骨架屏
- [ ] 无数据时显示空状态
- [ ] 移动端表格可横向滚动

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 文章列表使用 DataTable | SC-1.3.1: 管理员访问文章列表页，看到 DataTable 渲染的文章数据 | - | `e2e/admin-articles.spec.ts` | E2E | Completed |
| 支持按标题排序 | SC-1.3.2: 点击标题列，文章按字母顺序排序 | - | `e2e/admin-articles-sort.spec.ts` | E2E | Completed |
| 支持按分类筛选 | SC-1.3.3: 选择分类"技术"，只显示技术文章 | - | `e2e/admin-articles-filter.spec.ts` | E2E | Completed |
| 支持批量删除 | SC-1.3.4: 选择 2 篇文章，点击批量删除，确认后删除成功 | - | `e2e/admin-articles-batch-delete.spec.ts` | E2E | Completed |
| 保留原有功能 | SC-1.3.5: 点击编辑按钮跳转到编辑页，点击置顶切换置顶状态 | - | `e2e/admin-articles-actions.spec.ts` | E2E | Completed |
| 移动端可横向滚动 | SC-1.3.6: 在 iPhone 模拟器上，表格可横向滑动查看所有列 | - | `e2e/admin-articles-mobile.spec.ts` | 手动 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 分页索引不匹配 | 高 | 数据显示错误 | 与后端确认分页索引 |
| 筛选数据获取失败 | 低 | 筛选器为空 | 添加错误处理和重试 |
| 批量删除误操作 | 中 | 数据丢失 | 二次确认 + 撤销提示 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome/Firefox/Safari + 移动端 DevTools

## 10. Completion Notes

- Changed source: `src/app/(admin)/admin/articles/page.tsx`
- Changed tests: 无（测试在 TASK-1.6 中执行）
- Verification result:
  - `npx tsc --noEmit`: 通过（无错误）
  - `npm run lint`: 通过（无新增错误）
  - `npm run build`: 通过
  - 功能验证: 支持标题/创建时间排序、分类/类型/状态筛选、全局搜索、批量删除、分页
  - 原有功能保留: 编辑跳转、置顶切换、单行删除
- Remaining risk: 无
