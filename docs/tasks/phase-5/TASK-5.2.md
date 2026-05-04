# Task 5.2: 数据表格移动端适配

> **Task ID**: TASK-5.2
> **Phase**: PHASE-5
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-1.2, TASK-5.1

---

## 1. Background

Phase 1 已完成 DataTable 核心组件，但当前表格在移动端（<768px）显示效果差：列被挤压、文字截断、操作按钮重叠。管理后台的核心功能（文章、评论、留言管理）都依赖表格，移动端表格适配是管理后台可用的关键。

## 2. Goal

改造 DataTable 组件，使其在移动端支持横向滚动、关键列优先展示、次要列隐藏，并确保批量操作按钮在移动端可用。

## 3. Scope

### In Scope

- 表格容器横向滚动（移动端）
- 关键列优先展示，次要列在小屏幕隐藏
- 批量操作按钮适配（移动端全宽或简化）
- 表格工具栏（搜索、筛选）移动端适配
- 分页组件移动端适配
- 应用于所有使用 DataTable 的页面

### Out of Scope

- 卡片式表格（后续优化）
- 表格列顺序自定义
- 移动端专属表格布局（如纵向堆叠）

## 4. Users / Actors

- **博主/管理员**: 在手机或平板上查看、管理表格数据

## 5. Behavior Contract

### 列可见性策略

```typescript
// 列定义增加响应式可见性
interface ColumnMeta {
  // 列在何时可见
  responsive?: {
    sm?: boolean;   // < 640px
    md?: boolean;   // 640px - 768px
    lg?: boolean;   // 768px - 1024px
    xl?: boolean;   // > 1024px
  };
}

// 默认策略：关键列（名称/标题 + 状态 + 操作）始终可见
// 次要列（ID、创建时间、更新时间、统计信息）在小屏隐藏
```

### 各页面列配置

| 页面 | 关键列（始终可见） | 次要列（md 以下隐藏） |
|------|-------------------|---------------------|
| 文章 | 标题、状态、操作 | ID、分类、标签、创建时间、更新时间、浏览量 |
| 评论 | 内容、状态、操作 | ID、文章、评论者、时间 |
| 留言 | 内容、状态、操作 | ID、昵称、时间 |
| 说说 | 内容、状态、操作 | ID、时间 |
| 相册 | 封面、名称、操作 | ID、图片数、创建时间 |
| 分类 | 名称、操作 | ID、文章数、创建时间 |
| 标签 | 名称、操作 | ID、文章数、创建时间 |
| 日志 | 内容、操作 | ID、时间、IP |

### 移动端 Toolbar 适配

- 搜索框：占满可用宽度，下方换行
- 筛选器：折叠为下拉或简化
- 批量操作按钮：全宽显示，简化文字（"删除" 而非 "批量删除"）

### 横向滚动

- 表格外层容器 `overflow-x-auto`
- 显示横向滚动条（自定义样式，不占用空间）
- 首列（关键列）可设为 `sticky left-0`，滚动时固定

## 6. Acceptance Criteria

- [ ] 移动端表格可横向滚动查看所有列
- [ ] 关键列（名称/标题 + 状态 + 操作）始终可见
- [ ] 次要列在 md 以下断点自动隐藏
- [ ] 表格首列支持 sticky 固定（可选，视复杂度）
- [ ] 批量操作按钮在移动端全宽显示
- [ ] 搜索框在移动端占满宽度
- [ ] 分页组件在移动端简化（隐藏快速跳转）
- [ ] 所有 8 个列表页表格移动端可用
- [ ] 横向滚动流畅，无卡顿
- [ ] 深色模式无视觉问题
- [ ] 触摸设备上可左右滑动滚动

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 横向滚动 | SC-5.2.1: 管理员在手机上查看文章列表，可左右滑动查看所有列 | `test/datatable/mobile-scroll.test.tsx` | `e2e/admin-table-scroll.spec.ts` | 手动 + E2E | Not Started |
| 次要列隐藏 | SC-5.2.2: 在 375px 宽度下，只显示标题、状态、操作列 | `test/datatable/column-hide.test.tsx` | `e2e/admin-table-columns.spec.ts` | DevTools | Not Started |
| 批量操作适配 | SC-5.2.3: 移动端批量删除按钮占满宽度，文字简化为"删除" | `test/datatable/batch-mobile.test.tsx` | `e2e/admin-table-batch-mobile.spec.ts` | 手动 + E2E | Not Started |
| 搜索框适配 | SC-5.2.4: 移动端搜索框占满 Toolbar 宽度 | `test/datatable/search-mobile.test.tsx` | `e2e/admin-table-search-mobile.spec.ts` | 手动 + E2E | Not Started |
| 分页简化 | SC-5.2.5: 移动端分页隐藏快速跳转输入框 | `test/datatable/pagination-mobile.test.tsx` | `e2e/admin-table-pagination-mobile.spec.ts` | 手动 + E2E | Not Started |
| 所有页面覆盖 | SC-5.2.6: 所有 8 个列表页在移动端均可正常显示表格 | - | `e2e/admin-table-all-pages.spec.ts` | 手动 | Not Started |
| 触摸滚动 | SC-5.2.7: 在手机上可左右触摸滑动滚动表格 | - | `e2e/admin-table-touch.spec.ts` | 真机 | Not Started |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| sticky 列与横向滚动冲突 | 中 | 布局异常 | 测试各浏览器，必要时放弃 sticky |
| 批量操作按钮在小屏拥挤 | 中 | 操作困难 | 简化按钮文字，使用图标 |
| 各页面列配置遗漏 | 中 | 某页面移动端显示异常 | 按页面逐一检查 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome DevTools 设备模拟（所有列表页）
- Manual: Safari iOS 模拟器（如可用）
- Manual: 真机测试（如可用）

## 10. Completion Notes

- Changed source: `src/components/data-table/data-table.tsx`, `src/components/data-table/data-table-toolbar.tsx`, `src/components/data-table/data-table-pagination.tsx`, `src/hooks/use-responsive-columns.ts`
- Changed tests: `e2e/admin-table-*.spec.ts`, `test/datatable/*.test.tsx`
- Verification result: 待填写
- Remaining risk: 待填写
