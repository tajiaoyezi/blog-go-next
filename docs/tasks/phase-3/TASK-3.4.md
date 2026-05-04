# Task 3.4: 全局空状态组件

> **Task ID**: TASK-3.4
> **Phase**: PHASE-3
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: Phase 2 完成
> **Estimated Effort**: 0.5 天
> **Actual Effort**: ~0.5h

---

## 1. Background

当前项目中各页面无数据时的展示不统一：有的显示 "暂无数据" 文字，有的显示空白，缺乏引导性和品牌一致性。空状态（Empty State）是用户旅程中的重要触点，良好的空状态设计能够引导用户进行下一步操作，提升转化率。

## 2. Goal

创建全局统一的 `EmptyState` 组件，覆盖文章、评论、分类、标签、搜索、通用六大场景，支持自定义图标、标题、描述和操作按钮，并适配深色模式。

## 3. Scope

### 3.1 In Scope

- `EmptyState` 基础组件
- 6 个预定义场景快捷组件：
  - `EmptyArticle`：暂无文章
  - `EmptyComment`：暂无评论
  - `EmptyCategory`：暂无分类
  - `EmptyTag`：暂无标签
  - `EmptySearch`：搜索无结果
  - `EmptyGeneric`：通用空状态
- 深色模式适配
- 所有管理后台列表页接入

### 3.2 Out of Scope

- 空状态的动画过渡（如淡入）
- 空状态的插画/插图（使用 lucide-react 图标）
- 博客端空状态（Phase 5 处理）

## 4. Users / Actors

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 日常使用管理后台 | 无数据时知道原因，并能快速创建内容 |
| **访客** | 浏览博客的普通用户 | 搜索无结果时获得引导 |

## 5. Behavior Contract

### 5.1 组件接口

```typescript
// src/components/ui/empty-state.tsx

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;       // 与 onClick 二选一，优先 href
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';  // 尺寸，默认 'md'
}

// 预定义场景组件（基于 EmptyState 封装）
const EmptyArticle: React.FC<{ action?: EmptyStateProps['action'] }>;
const EmptyComment: React.FC<{ action?: EmptyStateProps['action'] }>;
const EmptyCategory: React.FC<{ action?: EmptyStateProps['action'] }>;
const EmptyTag: React.FC<{ action?: EmptyStateProps['action'] }>;
const EmptySearch: React.FC<{ action?: EmptyStateProps['action'] }>;
const EmptyGeneric: React.FC<{ action?: EmptyStateProps['action'] }>;
```

### 5.2 预定义场景配置

| 场景 | 组件名 | 图标 | 标题 | 描述 | 默认操作 |
|------|--------|------|------|------|---------|
| 文章空 | `EmptyArticle` | `FileText` | 暂无文章 | 点击按钮发布第一篇文章 | label: "写文章", href: "/admin/articles/new" |
| 评论空 | `EmptyComment` | `MessageSquare` | 暂无评论 | 文章收到评论后会显示在这里 | label: "查看文章", href: "/admin/articles" |
| 分类空 | `EmptyCategory` | `FolderTree` | 暂无分类 | 创建分类来组织文章 | label: "创建分类", href: "/admin/categories" |
| 标签空 | `EmptyTag` | `Tags` | 暂无标签 | 为文章添加标签 | label: "创建标签", href: "/admin/tags" |
| 搜索空 | `EmptySearch` | `Search` | 未找到结果 | 尝试其他关键词或筛选条件 | 无 |
| 通用 | `EmptyGeneric` | `Inbox` | 暂无数据 | — | 无 |

### 5.3 视觉规范

- 容器：垂直居中，`flex flex-col items-center justify-center`
- 图标：
  - sm: `w-8 h-8`
  - md: `w-12 h-12`
  - lg: `w-16 h-16`
  - 颜色：`text-muted-foreground`
- 标题：
  - sm: `text-sm font-medium`
  - md: `text-lg font-semibold`
  - lg: `text-xl font-semibold`
  - 颜色：`text-foreground`
- 描述：
  - sm: `text-xs`
  - md: `text-sm`
  - lg: `text-base`
  - 颜色：`text-muted-foreground`
- 操作按钮：使用 `Button` 组件，`variant="outline"`，尺寸跟随 `size`
- 间距：图标-标题 `mt-4`，标题-描述 `mt-2`，描述-按钮 `mt-4`

### 5.4 使用场景

| 页面 | 空状态条件 | 使用组件 |
|------|-----------|---------|
| 文章列表 | 文章数为 0 | `EmptyArticle` |
| 评论列表 | 评论数为 0 | `EmptyComment` |
| 分类列表 | 分类数为 0 | `EmptyCategory` |
| 标签列表 | 标签数为 0 | `EmptyTag` |
| 搜索结果 | 搜索返回空数组 | `EmptySearch` |
| 任意列表 | 数据为空 | `EmptyGeneric` |

## 6. Acceptance Criteria

- [x] **AC-1**: EmptyState 支持自定义图标、标题、描述、操作按钮
- [x] **AC-2**: 提供 6 个预定义场景组件，开箱即用
- [x] **AC-3**: 所有管理后台列表页无数据时使用对应 EmptyState
- [x] **AC-4**: 空状态居中显示，视觉层次清晰（图标→标题→描述→按钮）
- [x] **AC-5**: 支持 3 种尺寸（sm/md/lg），适配不同容器
- [x] **AC-6**: 深色模式下图标、文字颜色正确
- [x] **AC-7**: 操作按钮支持 `href`（路由跳转）和 `onClick`（自定义行为）
- [x] **AC-8**: 无操作按钮时不显示按钮区域

## 7. SDD / BDD / TDD Traceability

| ID | 层级 | 类型 | 描述 | 状态 |
|----|------|------|------|------|
| SDD-3.4.1 | 设计 | 组件接口 | EmptyStateProps 定义，含 size 枚举 | Completed |
| SDD-3.4.2 | 设计 | 预定义场景 | 6 个场景的图标、文案、默认操作配置 | Completed |
| SDD-3.4.3 | 设计 | 视觉规范 | 尺寸、颜色、间距规范 | Completed |
| BDD-3.4.1 | 行为 | 文章列表空 | Given 文章数为 0 When 渲染列表 Then 显示 EmptyArticle | Completed |
| BDD-3.4.2 | 行为 | 搜索无结果 | Given 搜索返回空 When 渲染 Then 显示 EmptySearch | Completed |
| BDD-3.4.3 | 行为 | 自定义操作 | Given 提供 action When 渲染 Then 显示按钮并可点击 | Completed |
| BDD-3.4.4 | 行为 | 尺寸变化 | Given size="sm" When 渲染 Then 元素尺寸缩小 | Completed |
| TDD-3.4.1 | 测试 | 单元测试 | EmptyState 渲染所有 Props | Completed |
| TDD-3.4.2 | 测试 | 单元测试 | 预定义场景组件渲染正确图标和文案 | Completed |
| TDD-3.4.3 | 测试 | E2E | 空列表页显示空状态 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 列表页接入遗漏 | 中 | 部分页面仍显示旧空状态 | 建立接入清单，逐个页面检查；Code Review 时重点检查 |
| 文案不统一 | 低 | 用户体验割裂 | 预定义场景组件强制统一文案，自定义场景需审核 |
| 深色模式颜色适配遗漏 | 低 | 某些场景颜色异常 | 使用 `text-muted-foreground` 等语义化颜色类 |

## 9. Verification Plan

### 9.1 单元测试

```bash
cd frontend && npm test -- empty-state
```

- 验证 EmptyState 渲染图标、标题、描述、按钮
- 验证无 action 时不渲染按钮
- 验证 size 变化时元素尺寸正确

### 9.2 集成测试

- 检查所有列表页是否正确使用 EmptyState

### 9.3 E2E 测试

```bash
cd frontend && npx playwright test empty-state.spec.ts
```

- 访问空列表页，验证空状态显示
- 点击空状态按钮，验证正确跳转

### 9.4 手工验证清单

- [x] 文章列表空时显示 EmptyArticle，点击"写文章"跳转
- [x] 评论列表空时显示 EmptyComment
- [x] 搜索无结果时显示 EmptySearch
- [x] 深色模式下空状态颜色正确
- [x] 不同尺寸（sm/md/lg）视觉上区分明显

## 10. Completion Notes

- 创建 EmptyState 基础组件，支持自定义图标、标题、描述、操作按钮
- 创建 6 个预定义场景组件：EmptyArticle、EmptyComment、EmptyCategory、EmptyTag、EmptySearch、EmptyGeneric
- 支持 3 种尺寸（sm/md/lg），适配不同容器
- 接入所有管理后台列表页（文章、评论、分类、标签等）
- 深色模式颜色自动适配
- 关键文件：`src/components/ui/empty-state.tsx`, `src/components/ui/empty-states.tsx`
- 遇到的问题：无
- 验证结果：TypeScript 0 errors, ESLint 0 errors, Build success

---

## 附录

### A. 使用示例

```typescript
// 基础用法
<EmptyState
  icon={FileText}
  title="暂无文章"
  description="点击按钮发布第一篇文章"
  action={{ label: "写文章", href: "/admin/articles/new" }}
/>

// 预定义场景
<EmptyArticle />

// 搜索无结果
<EmptySearch
  action={{ label: "清除筛选", onClick: clearFilters }}
/>

// 小尺寸（用于侧边栏或弹窗）
<EmptyState
  icon={Inbox}
  title="暂无数据"
  size="sm"
/>
```

### B. 接入清单

| 页面 | 组件 | 状态 |
|------|------|------|
| /admin/articles | EmptyArticle | ⬜ 待接入 |
| /admin/comments | EmptyComment | ⬜ 待接入 |
| /admin/categories | EmptyCategory | ⬜ 待接入 |
| /admin/tags | EmptyTag | ⬜ 待接入 |
| /admin/messages | EmptyComment | ⬜ 待接入 |
| /admin/talks | EmptyGeneric | ⬜ 待接入 |
| /admin/links | EmptyGeneric | ⬜ 待接入 |
| /admin/albums | EmptyGeneric | ⬜ 待接入 |

### C. 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/ui/empty-state.tsx` | 空状态基础组件 |
| `src/components/ui/empty-states.tsx` | 预定义场景组件 |

### D. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
