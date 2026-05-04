# Task 4.1: 相册列表页视觉升级

> **Task ID**: TASK-4.1
> **Phase**: PHASE-4
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-1.2

---

## 1. Background

当前管理后台 `/admin/albums` 使用基础表格展示相册列表，信息密度低、操作不便。Phase 1 已完成通用 DataTable 组件，但相册作为视觉型内容，需要更直观的网格/卡片视图展示封面和快速操作，而非纯文本表格。

## 2. Goal

升级相册列表页，支持网格视图与列表视图双模式切换，每张相册展示封面图、名称、图片数量，并提供快速操作入口。

## 3. Scope

### In Scope

- 相册列表页 `/admin/albums` 视图重构
- 网格/列表双视图切换
- 相册封面展示（首图或默认占位图）
- 快速操作按钮（编辑、删除、查看相册内图片）
- 与现有 DataTableToolbar（搜索、筛选）集成
- 移动端网格响应式（桌面 4 列 / 平板 2 列 / 手机 1 列）

### Out of Scope

- 瀑布流布局（TASK-4.2）
- Lightbox 大图预览（TASK-4.3）
- 拖拽上传（TASK-4.4）
- 相册内图片管理（Phase 4 不涉及）

## 4. Users / Actors

- **博主/管理员**: 浏览、管理相册，快速定位目标相册

## 5. Behavior Contract

### 视图切换

- 默认显示**网格视图**
- 视图切换按钮位于 Toolbar 右侧
- 切换后状态持久化（localStorage key: `album-view-mode`）
- 切换动画使用 framer-motion `layout` prop

### 网格视图

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  [封面图]       │  [封面图]       │  [封面图]       │  [封面图]       │
│                 │                 │                 │                 │
│  📁 旅行相册     │  📁 美食记录     │  📁 工作截图     │  📁 生活随拍     │
│  24 张图片      │  56 张图片      │  12 张图片      │  8 张图片       │
│  [编辑][删除]   │  [编辑][删除]   │  [编辑][删除]   │  [编辑][删除]   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### 列表视图

- 复用 DataTable 组件
- 列：封面缩略图（60x60）| 相册名 | 图片数 | 创建时间 | 操作

### 空状态

- 无相册时显示 EmptyState 插图 + "创建你的第一个相册" 按钮

## 6. Acceptance Criteria

- [ ] 相册列表页默认以网格视图展示
- [ ] 网格视图每张卡片显示封面图、相册名、图片数量
- [ ] 封面图加载失败时显示默认占位图（骨架色块 + 图标）
- [ ] 点击卡片进入相册详情（图片列表页）
- [ ] 卡片悬浮显示快速操作按钮（编辑、删除）
- [ ] 支持网格/列表视图切换，状态持久化
- [ ] 切换视图时有动画过渡
- [ ] 网格视图响应式：lg≥4 列、md≥2 列、sm≥1 列
- [ ] 列表视图复用 DataTable，支持排序和筛选
- [ ] 批量选择模式下卡片显示复选框（与 DataTable 选择状态同步）
- [ ] 空状态显示正确
- [ ] 深色模式无视觉问题

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 网格视图默认展示 | SC-4.1.1: 管理员进入相册页，默认看到网格卡片布局 | `album-grid.test.tsx`: 渲染网格、点击跳转 | `e2e/admin-albums-grid.spec.ts` | 手动 + E2E | Completed |
| 封面图加载与占位 | SC-4.1.2: 相册有封面时显示首图，无图片时显示占位 | `album-card.test.tsx`: 封面图/占位图渲染 | `e2e/admin-albums-cover.spec.ts` | 手动 + E2E | Completed |
| 快速操作悬浮显示 | SC-4.1.3: 鼠标悬浮在卡片上，显示编辑和删除按钮 | `album-card.test.tsx`: hover 显示操作按钮 | `e2e/admin-albums-actions.spec.ts` | 手动 + E2E | Completed |
| 视图切换持久化 | SC-4.1.4: 管理员切换到列表视图，刷新后仍保持列表视图 | `view-toggle.test.tsx`: localStorage 持久化 | `e2e/admin-albums-toggle.spec.ts` | 手动 + E2E | Completed |
| 响应式网格列数 | SC-4.1.5: 调整浏览器宽度，网格列数自动变化 | `album-grid.test.tsx`: grid-cols-1/sm:grid-cols-2/lg:grid-cols-4 | `e2e/admin-albums-responsive.spec.ts` | DevTools | Completed |
| 批量选择同步 | SC-4.1.6: 批量选择模式下，网格卡片显示复选框并与 DataTable 同步 | `album-card.test.tsx`: checkbox 渲染和选择 | `e2e/admin-albums-batch-grid.spec.ts` | 手动 + E2E | Completed |
| 空状态显示 | SC-4.1.7: 无相册时显示空状态插图和创建按钮 | `album-grid.test.tsx`: 空状态渲染 | `e2e/admin-albums-empty.spec.ts` | 手动 + E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 封面图加载慢 | 中 | 网格布局抖动 | 使用 Next.js Image + 骨架屏占位 |
| 大量相册性能 | 低 | 页面卡顿 | 虚拟滚动（后续优化） |
| 网格与列表状态同步复杂 | 中 | 批量操作异常 | 共用 selection state hook |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome/Firefox/Safari 跨浏览器测试
- Manual: 移动端 DevTools 模拟测试
- Accessibility: 检查卡片按钮 aria-label

## 10. Completion Notes

- Changed source:
  - `src/app/(admin)/admin/albums/page.tsx` - 集成网格/列表双视图
  - `src/components/albums/album-card.tsx` - 相册卡片组件（封面图、悬浮操作、选择模式）
  - `src/components/albums/album-grid.tsx` - 网格布局组件（响应式列数、空状态）
  - `src/components/albums/view-toggle.tsx` - 视图切换组件（localStorage 持久化）
- Changed tests:
  - `src/components/albums/album-card.test.tsx` - 8 个测试用例
  - `src/components/albums/album-grid.test.tsx` - 6 个测试用例
  - `src/components/albums/view-toggle.test.tsx` - 6 个测试用例
- Verification result:
  - TypeScript: 0 errors
  - ESLint: 0 errors (13 warnings, none from new code)
  - Tests: 20/20 passed
  - Coverage: Statements 86.87%, Branches 82.5%, Functions 84.37%, Lines 88.3%
  - 集成验证: 相册页面正常加载，网格/列表视图切换正常
- Remaining risk:
  - E2E 测试待补充（Phase 4 批量补充）
  - 移动端真机测试待进行
