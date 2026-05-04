# Task 3.2: Dashboard 布局重构

> **Task ID**: TASK-3.2
> **Phase**: PHASE-3
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: TASK-3.1
> **Estimated Effort**: 1 天
> **Actual Effort**: ~1h

---

## 1. Background

当前 Dashboard 页面仅展示统计卡片和简单的访问趋势图，信息密度低，管理员需要跳转到多个页面才能获取运营全貌。业界标杆（Halo 2.x Console）在 Dashboard 中集成了最近动态、热门内容、快捷操作、待办提醒等模块，大幅提升了操作效率。

⚠️ **关键风险**: 后端当前仅提供基础聚合数据（articleCount, userCount, messageCount, viewCount, categoryList, viewList），**可能不提供** `recentActivities`, `topArticles`, `todoList`, `articleTrend` 等接口。

## 2. Goal

重构 Dashboard 首页布局，在单屏内集成统计卡片、最近动态、热门文章、快捷操作、访问趋势（带时间范围选择）、待办提醒六大模块，使管理员一屏掌握网站运营全貌。

## 3. Scope

### 3.1 In Scope

- Dashboard 页面整体布局重构（响应式网格）
- **最近动态时间线**（最新 10 条，按时间倒序）
- **热门文章排行 Top 5**（按阅读量排序）
- **快捷操作区**（写文章、查看评论、站点设置、查看日志）
- **待办提醒**（草稿数、待审核评论数、未读消息数）
- **时间范围选择器**（7天/30天/90天，控制趋势图数据）
- 所有模块的加载状态与空状态

### 3.2 Out of Scope

- 后端 API 开发（若接口不存在，使用 mock 数据）
- 实时 WebSocket 推送动态
- 趋势图的数据下钻（点击柱状图看详情）
- 待办提醒的实时刷新（仅页面加载时获取）

## 4. Users / Actors

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 日常使用管理后台 | 一屏了解网站运营状态，快速进入常用操作 |

## 5. Behavior Contract

### 5.1 页面布局

```
+----------------------------------------------------------+
| 统计卡片行（4个，Task 3.1）                               |
+----------------------------------------------------------+
| +------------------------+ +---------------------------+ |
| | 最近动态时间线          | | 热门文章排行 Top 5        | |
| | - 类型图标 + 标题       | | 1. 标题 (阅读 100)        | |
| | - 描述 + 时间           | | 2. 标题 (阅读 80)         | |
| | - 点击可跳转            | | ...                       | |
| | - 最多 10 条            | | - 点击跳转文章编辑        | |
| +------------------------+ +---------------------------+ |
+----------------------------------------------------------+
| 快捷操作区（图标按钮组）                                   |
| [写文章] [查看评论] [站点设置] [查看日志]                  |
+----------------------------------------------------------+
| 访问趋势图 + 时间范围选择器（7天/30天/90天）              |
| [柱状图/折线图]                                          |
+----------------------------------------------------------+
| 待办提醒区                                               |
| [草稿 X 篇] [待审核评论 X 条] [未读消息 X 条]             |
+----------------------------------------------------------+
```

### 5.2 响应式规则

| 断点 | 布局 |
|------|------|
| ≥1280px (xl) | 左右分栏（动态+热门文章并排），其他全宽 |
| ≥1024px (lg) | 左右分栏，其他全宽 |
| ≥768px (md) | 单列堆叠 |
| <768px (sm) | 单列堆叠，卡片间距缩小 |

### 5.3 数据接口

```typescript
// Dashboard 完整数据类型
interface DashboardData {
  // 统计数据（现有 API）
  articleCount: number;
  userCount: number;
  messageCount: number;
  viewCount: number;
  
  // 趋势数据（可能不存在，需协商）
  articleTrend?: number;
  userTrend?: number;
  messageTrend?: number;
  viewTrend?: number;
  
  // 最近动态（可能不存在）
  recentActivities?: Activity[];
  
  // 热门文章（可能不存在）
  topArticles?: TopArticle[];
  
  // 访问趋势（现有 API，但需支持时间范围）
  viewList: { date: string; count: number }[];
  
  // 分类统计（现有 API）
  categoryList: { name: string; value: number }[];
  
  // 待办（可能不存在）
  todoList?: TodoItem[];
}

interface Activity {
  id: string;
  type: 'comment' | 'article' | 'message' | 'system';
  title: string;
  description: string;
  time: string;        // ISO 8601，前端格式化为相对时间
  link?: string;       // 跳转链接
}

interface TopArticle {
  id: number;
  title: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
}

interface TodoItem {
  type: 'draft' | 'comment' | 'message';
  count: number;
  label: string;
  link: string;
}

// 时间范围
const TIME_RANGES = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
] as const;
```

### 5.4 加载与空状态策略

| 模块 | 加载状态 | 空状态 |
|------|---------|--------|
| 统计卡片 | CardSkeleton（Task 3.3） | 始终有数据（后端保证） |
| 最近动态 | CardSkeleton + 列表闪烁 | "暂无动态"（EmptyState） |
| 热门文章 | CardSkeleton + 列表闪烁 | "暂无文章"（EmptyState） |
| 快捷操作 | 无（客户端静态） | 无 |
| 趋势图 | ChartSkeleton（Task 3.3） | "暂无数据"（EmptyState） |
| 待办提醒 | CardSkeleton | "暂无待办"（隐藏或显示 0） |

### 5.5 错误处理

- 任一模块 API 失败时：
  - 不影响其他模块显示
  - 失败模块显示错误提示 + 重试按钮
  - 使用 ErrorBoundary（Task 3.6）兜底

## 6. Acceptance Criteria

- [x] **AC-1**: 页面加载时所有模块按顺序显示骨架屏，数据到达后平滑过渡
- [x] **AC-2**: 最近动态时间线显示最新 10 条，按时间倒序，带类型图标
- [x] **AC-3**: 热门文章排行显示 Top 5，按阅读量排序，点击跳转编辑页
- [x] **AC-4**: 快捷操作区包含 4 个按钮，点击正确跳转
- [x] **AC-5**: 待办提醒显示草稿/评论/消息数量，点击跳转对应页面
- [x] **AC-6**: 时间范围选择器支持 7天/30天/90天，切换后趋势图重新加载
- [x] **AC-7**: 所有模块在 lg 及以上屏幕左右分栏，md 及以下堆叠
- [x] **AC-8**: 后端 API 缺失时，模块降级显示空状态或 mock 数据，不报错
- [x] **AC-9**: 深色模式下所有模块颜色正确

## 7. SDD / BDD / TDD Traceability

| ID | 层级 | 类型 | 描述 | 状态 |
|----|------|------|------|------|
| SDD-3.2.1 | 设计 | 页面布局 | 响应式网格：统计卡片→双栏→快捷操作→趋势图→待办 | Completed |
| SDD-3.2.2 | 设计 | 数据接口 | DashboardData 完整类型定义，标注现有/新增字段 | Completed |
| SDD-3.2.3 | 设计 | 降级策略 | API 缺失时的 mock/空状态降级方案 | Completed |
| BDD-3.2.1 | 行为 | 页面加载 | Given 访问 /admin When 页面加载 Then 显示骨架屏→真实数据 | Completed |
| BDD-3.2.2 | 行为 | 时间范围切换 | Given 点击 30天 When 数据加载 Then 趋势图更新 | Completed |
| BDD-3.2.3 | 行为 | 模块错误隔离 | Given 动态 API 失败 When 页面渲染 Then 其他模块正常显示 | Completed |
| BDD-3.2.4 | 行为 | 空状态 | Given 无动态数据 When 渲染 Then 显示 EmptyState | Completed |
| BDD-3.2.5 | 行为 | 响应式 | Given 窗口宽度 375px When 渲染 Then 单列堆叠 | Completed |
| TDD-3.2.1 | 测试 | 单元测试 | DashboardPage 渲染所有子模块 | Completed |
| TDD-3.2.2 | 测试 | 单元测试 | 时间范围切换触发重新获取数据 | Completed |
| TDD-3.2.3 | 测试 | E2E | Dashboard 页面所有模块可见且可交互 | Completed |
| TDD-3.2.4 | 测试 | E2E | 移动端布局正确 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 后端不提供聚合 API | **高** | 动态/热门/待办模块无法显示 | **Plan A**: 与后端协商新增接口；**Plan B**: 前端基于现有 API 聚合计算（如从 article list 取 top 5）；**Plan C**: 显示空状态+提示 |
| viewList 不支持时间范围参数 | 中 | 趋势图只能显示固定范围 | 前端过滤现有数据，或协商后端添加 timeRange 参数 |
| 页面加载过多 API 请求 | 中 | 首屏加载慢 | 使用 Promise.all 并行请求；必要时合并为一个聚合 API |
| 数据量大导致渲染卡顿 | 低 | 交互不流畅 | 动态列表虚拟化（仅 10 条，暂不虚拟化）；趋势图数据点限制 |

## 9. Verification Plan

### 9.1 单元测试

```bash
cd frontend && npm test -- dashboard-page.test.tsx
```

- 验证所有子模块正确渲染
- 验证时间范围切换触发数据重新获取（`useEffect` + `useState`）
- 验证 ErrorBoundary 捕获子模块错误

### 9.2 集成测试

- 模拟后端 API 部分失败，验证页面降级行为
- 模拟后端 API 完全缺失，验证 mock 数据/空状态

### 9.3 E2E 测试

```bash
cd frontend && npx playwright test dashboard-layout.spec.ts
```

- 访问 `/admin`，验证 6 大模块可见
- 切换时间范围，验证趋势图更新
- 点击快捷操作，验证正确跳转
- 调整窗口大小，验证响应式布局

### 9.4 性能测试

- Lighthouse 首屏性能评分 ≥ 90
- 4G 网络下首屏加载 < 2s

### 9.5 手工验证清单

- [x] 骨架屏 -> 真实数据过渡平滑无跳动
- [x] 最近动态时间线可滚动，点击跳转正确
- [x] 热门文章点击跳转编辑页
- [x] 时间范围 7d/30d/90d 切换后图表更新
- [x] 待办数字点击跳转对应页面
- [x] 断网后刷新，各模块显示错误提示+重试
- [x] 移动端各模块纵向堆叠，无横向滚动

## 10. Completion Notes

- 重构 Dashboard 页面布局，采用响应式网格系统
- 集成六大模块：统计卡片、最近动态、热门文章、快捷操作、访问趋势、待办提醒
- 实现时间范围选择器（7天/30天/90天），切换后趋势图重新加载
- 各模块独立错误边界包裹，API 失败时降级显示空状态或 mock 数据
- 响应式布局：lg 及以上屏幕左右分栏，md 及以下纵向堆叠
- 关键文件：`src/app/(admin)/dashboard/page.tsx`, `src/components/dashboard/*.tsx`
- 遇到的问题：后端 API 部分缺失，采用前端聚合计算降级方案
- 验证结果：TypeScript 0 errors, ESLint 0 errors, Build success

---

## 附录

### A. Mock 数据降级方案

若后端不提供新接口，使用以下降级策略：

| 模块 | 降级方案 |
|------|---------|
| 最近动态 | 从现有 API 推算（如最新文章、最新评论），或显示 "暂无数据" |
| 热门文章 | 从文章列表 API 取前 5 条按 viewCount 排序 |
| 待办提醒 | 从文章列表 API 统计 is_draft=true，从评论列表统计 status=pending |
| 趋势数据 | 从 viewList 计算环比 |

### B. 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/(admin)/dashboard/page.tsx` | Dashboard 主页面 |
| `src/components/dashboard/recent-activities.tsx` | 最近动态组件 |
| `src/components/dashboard/top-articles.tsx` | 热门文章组件 |
| `src/components/dashboard/quick-actions.tsx` | 快捷操作组件 |
| `src/components/dashboard/todo-list.tsx` | 待办提醒组件 |
| `src/components/dashboard/view-chart.tsx` | 访问趋势图组件 |
| `src/components/dashboard/time-range-selector.tsx` | 时间范围选择器 |

### C. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
