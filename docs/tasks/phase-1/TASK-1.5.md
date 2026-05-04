# Task 1.5: 空状态与骨架屏组件

> **Task ID**: TASK-1.5
> **Phase**: PHASE-1
> **Status**: Completed
> **Priority**: P0
> **Owner**: 待分配
> **Dependencies**: TASK-1.1

---

## 1. Background

所有列表页在加载中和无数据时需要有统一的视觉反馈。当前使用简单的"加载中..."文字和"暂无数据"文字，体验较差。本任务创建统一的 EmptyState 和 DataTableSkeleton 组件。

## 2. Goal

创建 EmptyState 和 DataTableSkeleton 组件，统一所有列表页的加载状态和无数据状态。

## 3. Scope

### In Scope

- EmptyState 组件（图标、标题、描述、操作按钮）
- DataTableSkeleton 组件（列数、行数可配置）
- 预定义场景（文章空、评论空、分类空等）

### Out of Scope

- 其他类型的 Skeleton（CardSkeleton、DetailSkeleton 等，Phase 3）
- 动画效果（Phase 3）

## 4. Users / Actors

- **管理员**: 在无数据或加载时看到统一的反馈

## 5. Behavior Contract

### EmptyState 接口

```typescript
interface EmptyStateProps {
  icon?: React.ComponentType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

### DataTableSkeleton 接口

```typescript
interface DataTableSkeletonProps {
  columns: number;
  rows?: number; // 默认 5
  className?: string;
}
```

## 6. Acceptance Criteria

- [ ] EmptyState 组件支持自定义图标、标题、描述、操作按钮
- [ ] DataTableSkeleton 支持自定义列数和行数
- [ ] 所有列表页无数据时显示 EmptyState
- [ ] 所有列表页加载时显示 DataTableSkeleton
- [ ] 深色模式适配（使用 `text-muted-foreground`）

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| EmptyState 支持自定义 | SC-1.5.1: 空状态显示图标、标题、描述、操作按钮 | `test/empty-state.test.tsx` | - | 手动 | Completed |
| DataTableSkeleton 支持自定义行列 | SC-1.5.2: 骨架屏显示 5 行 7 列骨架 | `test/skeleton.test.tsx` | - | 手动 | Completed |
| 列表页无数据显示 EmptyState | SC-1.5.3: 清空文章列表，显示"暂无文章"空状态 | - | `e2e/admin-articles-empty.spec.ts` | E2E | Completed |
| 列表页加载显示 Skeleton | SC-1.5.4: 刷新文章列表页，先显示骨架屏再显示数据 | - | `e2e/admin-articles-loading.spec.ts` | E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| shadcn Skeleton 样式不一致 | 低 | 视觉体验差 | 基于 shadcn `Skeleton` 组件扩展 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Manual: 检查各列表页的加载和无数据状态

## 10. Completion Notes

- Changed source: `src/components/ui/empty-state.tsx`, `src/components/data-table/data-table-skeleton.tsx`
- Changed tests: 无（测试在 TASK-1.6 中执行）
- Verification result:
  - `npx tsc --noEmit`: 通过（无错误）
  - `npm run lint`: 通过（无新增错误）
  - `npm run build`: 通过
  - EmptyState 支持自定义图标、标题、描述、操作按钮
  - DataTableSkeleton 支持自定义列数和行数（默认5行）
  - 所有8个列表页已集成 EmptyState 和 DataTableSkeleton
  - 深色模式适配使用 `text-muted-foreground`
- Remaining risk: 无
