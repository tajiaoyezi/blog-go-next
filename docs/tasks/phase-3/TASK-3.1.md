# Task 3.1: Dashboard 统计卡片升级

> **Task ID**: TASK-3.1
> **Phase**: PHASE-3
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: Phase 2 完成
> **Estimated Effort**: 0.5 天
> **Actual Effort**: ~0.5h

---

## 1. Background

当前 Dashboard 首页的统计卡片仅显示静态数值（文章数、用户数、留言数、访问量），缺乏趋势变化和加载状态反馈，信息密度不足。管理员无法直观感知数据波动，且网络延迟时页面出现空白。

## 2. Goal

升级 Dashboard 统计卡片组件，增加环比趋势指示（箭头 + 百分比）和骨架屏加载状态，使管理员能够一屏掌握核心指标的当前状态与变化趋势。

## 3. Scope

### 3.1 In Scope

- `StatsCard` 组件重构，增加 `trend`、`trendLabel`、`loading` 属性
- 4 张统计卡片（文章数、用户数、留言数、访问量）的统一升级
- 骨架屏加载状态（`CardSkeleton` 复用 Task 3.3 成果）
- 趋势视觉：上升绿色 ↗，下降红色 ↘，持平灰色 →
- 环比数据格式：百分比保留 1 位小数

### 3.2 Out of Scope

- 后端 API 改造（若后端不返回趋势数据，前端计算或 mock）
- 卡片点击跳转详情页
- 自定义时间范围的趋势计算（仅展示默认环比）

## 4. Users / Actors

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 日常使用管理后台 | 快速了解网站核心指标的变化趋势 |

## 5. Behavior Contract

### 5.1 组件接口

```typescript
// src/components/dashboard/stats-card.tsx

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;           // 环比变化率（如 0.15 表示 +15%）
  trendLabel?: string;      // 趋势标签（如"较上周"、"较上月"）
  loading?: boolean;        // 是否显示骨架屏
  className?: string;
}
```

### 5.2 视觉规范

- 卡片背景：`bg-card`，圆角 `rounded-xl`，阴影 `shadow-sm`
- 数值字体：`text-2xl font-bold tracking-tight`
- 趋势区域：图标（`TrendingUp`/`TrendingDown`/`Minus`）+ 百分比文字
  - 上升：`text-emerald-600 dark:text-emerald-400`
  - 下降：`text-red-600 dark:text-red-400`
  - 持平：`text-muted-foreground`
- 趋势标签：`text-xs text-muted-foreground`

### 5.3 加载行为

- `loading=true` 时：显示 `CardSkeleton`（Task 3.3 定义）
- 卡片容器高度固定，避免布局抖动

### 5.4 数据格式

- 数值 ≥ 10000 时缩写为 `1.2w`（中文语境）
- trend 为 null/undefined 时不显示趋势区域

## 6. Acceptance Criteria

- [x] **AC-1**: 统计卡片显示当前数值，格式正确（千分位缩写）
- [x] **AC-2**: 显示环比趋势，上升绿色 ↗，下降红色 ↘，持平灰色 →
- [x] **AC-3**: 显示趋势标签（如"较上周"）
- [x] **AC-4**: 加载状态显示骨架屏，高度与卡片一致
- [x] **AC-5**: 4 张统计卡片风格统一，间距一致
- [x] **AC-6**: 深色模式下趋势颜色正常显示
- [x] **AC-7**: 无趋势数据时不显示趋势区域（不报错）

## 7. SDD / BDD / TDD Traceability

| ID | 层级 | 类型 | 描述 | 状态 |
|----|------|------|------|------|
| SDD-3.1.1 | 设计 | StatsCard Props | `trend`, `trendLabel`, `loading` 三个新增属性定义 | Completed |
| SDD-3.1.2 | 设计 | 视觉规范 | 趋势颜色、字体大小、图标规范 | Completed |
| BDD-3.1.1 | 行为 | 正常展示 | Given 数据加载完成 When 渲染卡片 Then 显示数值+趋势 | Completed |
| BDD-3.1.2 | 行为 | 加载状态 | Given 数据加载中 When 渲染卡片 Then 显示骨架屏 | Completed |
| BDD-3.1.3 | 行为 | 无趋势数据 | Given trend 为 null When 渲染卡片 Then 不显示趋势区域 | Completed |
| BDD-3.1.4 | 行为 | 深色模式 | Given 深色模式 When 渲染卡片 Then 趋势颜色适配 | Completed |
| TDD-3.1.1 | 测试 | 单元测试 | StatsCard 渲染所有 Props | Completed |
| TDD-3.1.2 | 测试 | 单元测试 | StatsCard loading 状态渲染骨架屏 | Completed |
| TDD-3.1.3 | 测试 | E2E | Dashboard 页面统计卡片可见 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 后端不返回趋势数据 | 高 | 无法显示环比 | 前端基于现有 viewList 计算近 7 天环比；若无法计算则隐藏趋势区域 |
| 骨架屏高度与卡片不一致 | 低 | 布局跳动 | 使用固定高度容器包裹 |
| 数值缩写精度问题 | 低 | 显示不准确 | 统一使用 `Intl.NumberFormat` 或自定义格式化函数 |

## 9. Verification Plan

### 9.1 单元测试

```bash
cd frontend && npm test -- stats-card.test.tsx
```

- 验证所有 Props 正确渲染
- 验证 `loading=true` 时渲染骨架屏
- 验证 `trend` 为 undefined 时不渲染趋势区域

### 9.2 视觉回归

- DevTools 模拟 4G 网络，验证骨架屏 -> 真实数据的过渡无跳动
- 深色模式切换，验证颜色正确

### 9.3 E2E 测试

```bash
cd frontend && npx playwright test dashboard-stats.spec.ts
```

- 访问 `/admin`，验证 4 张卡片可见
- 验证趋势箭头和颜色正确

### 9.4 手工验证清单

- [x] 加载时骨架屏显示正常
- [x] 数据加载后数值、趋势、标签均显示
- [x] 上升/下降/持平三种状态颜色正确
- [x] 深色模式正常
- [x] 移动端卡片堆叠正常

## 10. Completion Notes

- 实现了 StatsCard 组件重构，新增 trend、trendLabel、loading 属性
- 支持环比趋势指示：上升绿色↗、下降红色↘、持平灰色→
- 集成骨架屏加载状态（复用 Task 3.3 CardSkeleton）
- 支持数值千分位缩写（≥10000 显示为 1.2w）
- 深色模式颜色自动适配
- 关键文件：`src/components/dashboard/stats-card.tsx`, `src/app/(admin)/dashboard/page.tsx`
- 遇到的问题：无
- 验证结果：TypeScript 0 errors, ESLint 0 errors, Build success

---

## 附录

### A. 参考代码

```typescript
// StatsCard 使用示例
<StatsCard
  title="文章总数"
  value={128}
  icon={FileText}
  trend={0.15}
  trendLabel="较上周"
  loading={isLoading}
/>
```

### B. 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/dashboard/stats-card.tsx` | 统计卡片组件 |
| `src/app/(admin)/dashboard/page.tsx` | Dashboard 页面 |

### C. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
