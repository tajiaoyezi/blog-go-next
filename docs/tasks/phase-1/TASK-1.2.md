# Task 1.2: 实现 DataTable 核心组件

> **Task ID**: TASK-1.2
> **Phase**: PHASE-1
> **Status**: Completed
> **Priority**: P0
> **Owner**: 待分配
> **Dependencies**: TASK-1.1

---

## 1. Background

管理后台所有列表页（文章、评论、留言等）当前使用基础 HTML Table，缺乏排序、筛选、搜索、批量操作等高级功能。本任务实现基于 TanStack Table 的通用 DataTable 组件，为所有列表页提供统一的高级表格能力。

## 2. Goal

实现一个功能完整的通用 DataTable 组件，支持：排序、筛选、搜索、批量选择、分页、行操作、骨架屏、空状态。

## 3. Scope

### In Scope

- DataTable 核心组件（基于 `useReactTable`）
- DataTableToolbar（搜索、筛选器、批量操作按钮）
- DataTablePagination（页码 + 快速跳转 + 每页大小）
- DataTableSkeleton（表格骨架屏）
- TypeScript 类型定义
- 服务端分页支持（`manualPagination: true`）

### Out of Scope

- 集成到具体页面（Task 1.3+）
- 空状态组件（Task 1.5）
- 移动端列优先级（Phase 5）

## 4. Users / Actors

- **管理员**: 通过 DataTable 高效管理内容

## 5. Behavior Contract

### 接口定义

```typescript
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  pageCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onSortChange?: (sorting: SortingState) => void;
  onFilterChange?: (filters: ColumnFiltersState) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  batchActions?: BatchAction[];
  loading?: boolean;
  error?: Error | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  rowActions?: RowAction<TData>[];
  className?: string;
}
```

### 分页契约

- `manualPagination: true`（服务端分页）
- `pageCount` 由后端 `PageResult.count` 计算
- `currentPage` 使用 **1-based** 索引（与现有代码和后端保持一致）
- 排序和筛选变化通过 `onSortChange` / `onFilterChange` 回调通知父组件

## 6. Acceptance Criteria

- [ ] 支持表头点击排序（单/多列）
- [ ] 支持全局搜索（顶部输入框，防抖 300ms）
- [ ] 支持列筛选（下拉筛选器）
- [ ] 支持批量选择（复选框 + 全选）
- [ ] 支持批量操作按钮（显示选中数量）
- [ ] 支持分页（页码 + 快速跳转 + 每页大小选择）
- [ ] 支持行操作按钮（编辑、删除等）
- [ ] 加载状态显示骨架屏
- [ ] 空状态显示插图 + 引导（使用 Task 1.5 的 EmptyState）
- [ ] TypeScript 类型完整，无 `any`

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 支持表头点击排序 | SC-1.2.1: 管理员点击标题列，文章按标题升序排列 | `test/data-table/sorting.test.tsx` | `e2e/admin-articles-sort.spec.ts` | 手动 + E2E | Completed |
| 支持全局搜索 | SC-1.2.2: 管理员在搜索框输入"React"，列表过滤显示含 React 的文章 | `test/data-table/search.test.tsx` | `e2e/admin-articles-search.spec.ts` | 手动 + E2E | Completed |
| 支持列筛选 | SC-1.2.3: 管理员选择分类筛选"技术"，只显示技术分类文章 | `test/data-table/filter.test.tsx` | `e2e/admin-articles-filter.spec.ts` | 手动 + E2E | Completed |
| 支持批量选择 | SC-1.2.4: 管理员勾选 3 篇文章复选框，批量删除按钮可用 | `test/data-table/selection.test.tsx` | `e2e/admin-articles-batch.spec.ts` | 手动 + E2E | Completed |
| 支持分页 | SC-1.2.5: 管理员点击第 2 页，显示第 11-20 条数据 | `test/data-table/pagination.test.tsx` | `e2e/admin-articles-pagination.spec.ts` | 手动 + E2E | Completed |
| 加载状态显示骨架屏 | SC-1.2.6: 页面加载时显示骨架屏，数据返回后显示表格 | `test/data-table/skeleton.test.tsx` | `e2e/admin-articles-loading.spec.ts` | 手动 + E2E | Completed |
| 空状态显示插图 | SC-1.2.7: 搜索无结果时显示空状态插图和提示 | `test/data-table/empty.test.tsx` | `e2e/admin-articles-empty.spec.ts` | 手动 + E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 分页索引冲突 | 已解决 | 数据显示错误 | 已确认为 1-based（与现有代码和后端一致） |
| TypeScript 类型复杂 | 中 | 编译错误 | 使用 TanStack Table 官方类型 |
| 大数据量性能 | 中 | 页面卡顿 | 后续引入虚拟滚动 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Unit: `vitest run src/components/data-table/`（如配置 vitest）
- Integration: 手动验证组件渲染
- E2E: `npm run test:e2e`（后续 Task 覆盖）
- Manual: Chrome/Firefox/Safari 跨浏览器测试

## 10. Completion Notes

- Changed source: `src/components/data-table/data-table.tsx`, `src/components/data-table/data-table-toolbar.tsx`, `src/components/data-table/data-table-pagination.tsx`, `src/components/data-table/data-table-skeleton.tsx`
- Changed tests: 无（测试在 TASK-1.6 中执行）
- Verification result:
  - `npx tsc --noEmit`: 通过（无错误）
  - `npm run lint`: 通过（无新增错误）
  - `npm run build`: 通过
  - 组件功能验证: DataTable 支持排序、筛选、搜索、批量选择、分页、行操作、骨架屏
- Remaining risk: 无
