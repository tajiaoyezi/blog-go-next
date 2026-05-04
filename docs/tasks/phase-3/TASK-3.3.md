# Task 3.3: 全局 Skeleton 体系

> **Task ID**: TASK-3.3
> **Phase**: PHASE-3
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: Phase 2 完成
> **Estimated Effort**: 0.5 天
> **Actual Effort**: ~0.5h

---

## 1. Background

当前项目中各页面加载状态不统一：有的使用文字 "Loading..."，有的使用简单的灰色块，缺乏品牌一致性和视觉反馈。骨架屏（Skeleton）是现代 UI 的标准加载状态，能够在数据到达前预览页面结构，减少用户感知等待时间。

## 2. Goal

建立全局统一的 Skeleton 组件体系，覆盖卡片、列表、表格、详情、图表五大场景，所有异步加载页面使用统一的骨架屏风格。

## 3. Scope

### 3.1 In Scope

- `CardSkeleton`：统计卡片/信息卡片骨架屏
- `CardListSkeleton`：卡片列表骨架屏（如文章卡片网格）
- `TableSkeleton`：数据表格骨架屏
- `DetailSkeleton`：详情页骨架屏（表单/信息展示）
- `ChartSkeleton`：图表骨架屏
- 统一的 shimmer 动画效果
- 深色模式适配

### 3.2 Out of Scope

- 自定义骨架屏形状（如圆形头像骨架屏，后续按需扩展）
- 骨架屏的渐进式内容揭示（skeleton -> 模糊内容 -> 清晰内容）
- 非 React 组件的骨架屏（如纯 HTML 页面）

## 4. Users / Actors

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 日常使用管理后台 | 页面加载时有结构预览，减少等待焦虑 |
| **访客** | 浏览博客的普通用户 | 文章列表、详情页加载流畅 |

## 5. Behavior Contract

### 5.1 组件接口

```typescript
// src/components/ui/skeleton-card.tsx
interface SkeletonCardProps {
  className?: string;
}

// src/components/ui/skeleton-card-list.tsx
interface SkeletonCardListProps {
  count?: number;      // 卡片数量，默认 4
  className?: string;
  columns?: number;    // 网格列数，默认根据断点自适应
}

// src/components/ui/skeleton-table.tsx
interface SkeletonTableProps {
  columns?: number;    // 列数，默认 5
  rows?: number;       // 行数，默认 5
  className?: string;
  showHeader?: boolean; // 是否显示表头骨架，默认 true
  showToolbar?: boolean; // 是否显示工具栏骨架，默认 false
}

// src/components/ui/skeleton-detail.tsx
interface SkeletonDetailProps {
  fields?: number;     // 字段数，默认 6
  className?: string;
  hasImage?: boolean;  // 是否包含图片区域，默认 false
}

// src/components/ui/skeleton-chart.tsx
interface SkeletonChartProps {
  className?: string;
  height?: number;     // 高度，默认 300
}
```

### 5.2 视觉规范

- 基础骨架色：`bg-muted`（shadcn/ui 内置）
- 动画：shimmer 效果（从左到右的渐变扫过）
- 圆角：`rounded-md`（与 shadcn/ui 组件一致）
- 间距：使用 `space-y-2` / `gap-4` 等 Tailwind 工具类

```css
/* shimmer 动画 */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    hsl(var(--muted) / 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}
```

### 5.3 各组件结构

#### CardSkeleton
```
+------------------+
| [图标]            |
| 标题行            |
| 数值行（宽 60%）  |
| 趋势行（宽 40%）  |
+------------------+
```

#### CardListSkeleton
```
+--------+ +--------+ +--------+ +--------+
| Card   | | Card   | | Card   | | Card   |
| Skeleton| | Skeleton| | Skeleton| | Skeleton|
+--------+ +--------+ +--------+ +--------+
```

#### TableSkeleton
```
+------------------------------------------+
| [工具栏]（可选）                            |
+----+----+----+----+----+
| TH | TH | TH | TH | TH |
+----+----+----+----+----+
| TD | TD | TD | TD | TD |
| TD | TD | TD | TD | TD |
| TD | TD | TD | TD | TD |
+----+----+----+----+----+
| [分页]                                   |
```

#### DetailSkeleton
```
+------------------+
| 标题行（宽 30%）  |
+------------------+
| [图片]（可选）    |
+------------------+
| 字段标签          |
| 字段值（宽 80%）  |
| 字段标签          |
| 字段值（宽 60%）  |
| ...               |
+------------------+
```

#### ChartSkeleton
```
+--------------------------+
| 标题行                    |
+--------------------------+
|                          |
|    [柱状图/折线图轮廓]     |
|    (使用灰色矩形模拟)      |
|                          |
+--------------------------+
```

### 5.4 深色模式

- 骨架色自动跟随 `bg-muted` 变量
- shimmer 渐变使用 `hsl(var(--muted) / 0.3)`，自动适配

## 6. Acceptance Criteria

- [x] **AC-1**: CardSkeleton 渲染卡片形状骨架屏，带 shimmer 动画
- [x] **AC-2**: CardListSkeleton 渲染指定数量的卡片骨架，支持响应式网格
- [x] **AC-3**: TableSkeleton 渲染指定行列的表格骨架，含表头
- [x] **AC-4**: DetailSkeleton 渲染指定字段数的详情页骨架
- [x] **AC-5**: ChartSkeleton 渲染图表区域骨架，高度可配置
- [x] **AC-6**: 所有 Skeleton 使用统一的 shimmer 动画
- [x] **AC-7**: 深色模式下骨架颜色自动适配
- [x] **AC-8**: 各组件接受 `className` 覆盖默认样式
- [x] **AC-9**: 文档中提供使用示例和常见场景

## 7. SDD / BDD / TDD Traceability

| ID | 层级 | 类型 | 描述 | 状态 |
|----|------|------|------|------|
| SDD-3.3.1 | 设计 | 组件接口 | 5 个 Skeleton 组件 Props 定义 | Completed |
| SDD-3.3.2 | 设计 | 动画规范 | shimmer CSS 动画定义 | Completed |
| SDD-3.3.3 | 设计 | 深色模式 | 使用 CSS 变量自动适配 | Completed |
| BDD-3.3.1 | 行为 | CardSkeleton | Given 加载中 When 渲染 Then 显示卡片骨架 | Completed |
| BDD-3.3.2 | 行为 | TableSkeleton | Given 表格加载中 When 渲染 Then 显示表格骨架 | Completed |
| BDD-3.3.3 | 行为 | 深色模式 | Given 深色模式 When 渲染骨架 Then 颜色正确 | Completed |
| TDD-3.3.1 | 测试 | 单元测试 | CardSkeleton 渲染正确结构 | Completed |
| TDD-3.3.2 | 测试 | 单元测试 | TableSkeleton 渲染指定行列 | Completed |
| TDD-3.3.3 | 测试 | 单元测试 | 所有 Skeleton 支持 className | Completed |
| TDD-3.3.4 | 测试 | E2E | Dashboard 加载时显示 Skeleton | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| shimmer 动画性能问题 | 低 | 低端设备卡顿 | 使用 `transform` 而非 `left` 动画，开启 GPU 加速；提供 `prefers-reduced-motion` 支持 |
| 骨架屏与实际内容结构不匹配 | 中 | 数据到达后布局跳动 | 骨架屏严格匹配真实内容的尺寸和间距 |
| shadcn/ui 升级导致样式冲突 | 低 | 骨架屏样式异常 | 使用 Tailwind 工具类而非硬编码颜色值 |

## 9. Verification Plan

### 9.1 单元测试

```bash
cd frontend && npm test -- skeleton
```

- 验证每个 Skeleton 组件渲染正确数量的子元素
- 验证 `className` 正确合并
- 验证动画类名存在

### 9.2 视觉回归

- DevTools 逐帧检查 shimmer 动画是否流畅
- 深色模式切换，验证颜色适配

### 9.3 E2E 测试

```bash
cd frontend && npx playwright test skeleton.spec.ts
```

- 访问各页面，验证加载状态显示正确的 Skeleton

### 9.4 手工验证清单

- [x] 所有 5 种 Skeleton 在 Storybook 或独立页面可预览
- [x] shimmer 动画流畅无卡顿
- [x] 深色模式下骨架颜色正确
- [x] 不同屏幕尺寸下 CardListSkeleton 网格自适应
- [x] TableSkeleton 的行列数可配置

## 10. Completion Notes

- 创建 5 个骨架屏组件：CardSkeleton、CardListSkeleton、TableSkeleton、DetailSkeleton、ChartSkeleton
- 统一 shimmer 动画效果（CSS transform GPU 加速）
- 支持 prefers-reduced-motion 媒体查询
- 深色模式自动适配（使用 CSS 变量 hsl(var(--muted))）
- 所有组件支持 className 自定义样式
- 关键文件：`src/components/ui/skeleton-*.tsx`
- 遇到的问题：无
- 验证结果：TypeScript 0 errors, ESLint 0 errors, Build success

---

## 附录

### A. 使用示例

```typescript
// 在 Dashboard 中使用
{isLoading ? (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
) : (
  <StatsCards data={data} />
)}

// 在文章列表中使用
{isLoading ? (
  <CardListSkeleton count={8} columns={4} />
) : (
  <ArticleList articles={articles} />
)}

// 在表格中使用
{isLoading ? (
  <TableSkeleton columns={5} rows={10} showToolbar showHeader />
) : (
  <DataTable data={data} />
)}
```

### B. 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/ui/skeleton-card.tsx` | 卡片骨架屏 |
| `src/components/ui/skeleton-card-list.tsx` | 卡片列表骨架屏 |
| `src/components/ui/skeleton-table.tsx` | 表格骨架屏 |
| `src/components/ui/skeleton-detail.tsx` | 详情页骨架屏 |
| `src/components/ui/skeleton-chart.tsx` | 图表骨架屏 |
| `src/components/ui/skeleton.tsx` | shadcn/ui 基础 Skeleton（复用） |

### C. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
