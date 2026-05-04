# blog-go-next 前端 UI 优化 Task Spec 技术审查报告

> **审查日期**: 2026-05-03
> **审查范围**: Phase 1-5 全部 28 个 Task Spec + Master Spec + 3 个 ADR
> **项目版本**: Next.js 16.2.3 + React 19.2.4 + Tailwind CSS 4

---

## 1. 关键风险（可能导致任务失败）

### 1.1 🔴 新增依赖均未安装，且存在 React 19 兼容性炸弹

| 依赖 | Spec 要求 | 实际状态 | 风险等级 |
|------|----------|---------|---------|
| `@tanstack/react-table` | Phase 1 安装 | **未安装** | 中 |
| ~~`react-dropzone`~~ | ~~Phase 2 安装~~ | ~~**不兼容 React 19**~~ | ~~已移除~~ |
| `framer-motion` | Phase 3 安装 | **未安装** | 中 |
| `yet-another-react-lightbox` | Phase 4 安装 | **未安装** | 🔴 **高** |
| `zod` | TASK-2.6 需要 | **未安装** | 🔴 **高** |
| `react-hook-form` | TASK-2.6 需要 | **未安装** | 🔴 **高** |
| `swr` | TASK-3.2 示例使用 | **未安装** | 中 |

**`react-dropzone`（v14/v15）peerDependencies 为 `react: '>= 16.8 || 18.0.0'`，不包含 React 19，已从 Master Spec 移除。使用原生 HTML5 Drag and Drop API + `<input type="file">` 替代，零依赖风险。**

**核心问题**：`yet-another-react-lightbox` v3.21.8+ 已支持 React 19（`peerDependencies: react: '^16.8.0 || ^17 || ^18 || ^19'`），但早期版本（<3.21.8）仅支持到 React 18。安装时必须指定 `yet-another-react-lightbox@^3.21.8` 以确保 React 19 兼容性。

`zod` 和 `react-hook-form` 是 TASK-2.6（表单验证）的核心依赖，缺失将直接导致 Phase 2 无法完成。

### 1.2 🔴 分页索引认知错误（伪问题导致真风险）

**位置**: TASK-1.2 分页契约 / TASK-1.3 API 契约

**问题**: Spec 多处标注"需确认后端 `current` 是 0-based 还是 1-based"，但现有代码已明确证明是 **1-based**：
- `src/app/(admin)/admin/articles/page.tsx:53`: `current=${page}`，初始值 `useState(1)`
- 后端 `PageResult.count` 配合 `Math.ceil(count / pageSize)` 计算总页数，也是 1-based 模型

**风险**: 如果开发者被 Spec 误导去"确认"后端分页索引，可能浪费时间；如果错误改为 0-based，会导致所有列表页第一页数据丢失。

### 1.3 🔴 Dashboard 聚合 API 大概率不存在，但工期未预留

**位置**: TASK-3.2

**问题**: Spec 已明确标注 `recentActivities`、`topArticles`、`todoList` 等字段"可能不存在"，但 TASK-3.2 工期仅 **1 天**。若后端无法提供这些 API，前端需要：
- 从现有文章列表/评论列表 API 聚合计算 Top 5
- 实现待办统计（草稿数、待审核评论数）
- 实现最近动态时间线

**评估**: 这些聚合逻辑 + 降级方案实现至少需要 **2 天**。

### 1.4 🔴 Error Boundary 与 Next.js App Router 架构冲突

**位置**: TASK-3.6

**问题**: Spec 要求"全局错误边界包裹整个应用"，使用 React class component 的 `componentDidCatch`。但 Next.js App Router 的错误处理机制是 `error.tsx`（放在 route segment 目录下），**在 RootLayout 外层包裹 ErrorBoundary class component 在 App Router 中不生效**。

**风险**: 按 Spec 实现后，全局错误捕获不工作，白屏问题依然存在。

### 1.5 🟡 DataTable 接口缺少服务端交互核心能力

**位置**: TASK-1.2 DataTableProps

**问题**: 接口定义了 `sortable`、`filterable`、`searchable` 等布尔开关，但缺少关键的回调函数：
- `onSortChange?: (sorting: SortingState) => void` — 服务端排序必需
- `onFilterChange?: (filters: ColumnFiltersState) => void` — 服务端筛选必需
- `error?: Error | null` — 仅 `loading` 不够，需要错误状态

**风险**: 没有这些回调，DataTable 只能做客户端排序/筛选，大数据量场景下性能差。

### 1.6 🟡 表格移动端适配方案与 TanStack Table 不兼容

**位置**: TASK-5.2

**问题**: Spec 定义的 `ColumnMeta.responsive` 方案：
```typescript
interface ColumnMeta {
  responsive?: {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
  };
}
```

**风险**: TanStack Table 的 `ColumnDef.meta` 是 `Record<string, any>`，但 DataTable 组件需要根据断点动态隐藏列。在 React/Next.js 的 SSR 环境下，基于 `window.innerWidth` 的断点判断会导致 hydration mismatch。正确的做法是在渲染层通过 CSS 控制（`hidden md:table-cell`），而非在 column definition 中配置。

---

## 2. 建议调整

### 2.1 工期调整

| 任务 | 原估 | 建议 | 原因 |
|------|------|------|------|
| TASK-1.1 安装依赖 | 0.5 天 | **1 天** | 6 个新依赖安装 + React 19 兼容性验证 |
| TASK-1.2 DataTable 核心 | 1 天 | **2 天** | 缺少 `onSortChange`/`onFilterChange`/`error` 接口设计 |
| TASK-3.2 Dashboard 布局 | 1 天 | **2 天** | API 缺失时的聚合/mock 逻辑 |
| TASK-4.2 瀑布流 | 1 天 | **1.5 天** | masonry 方案需要预研浏览器支持 |
| TASK-4.3 Lightbox | 1 天 | **1.5 天** | React 19 兼容性验证 + 降级方案预留 |
| **总工期** | **24 天** | **30-32 天** | |

### 2.2 DataTable 接口修正

```typescript
interface DataTableProps<TData> {
  // ... 现有字段 ...
  
  // 新增：服务端交互
  manualSorting?: boolean;       // 默认 true，使用服务端排序
  manualFiltering?: boolean;     // 默认 true，使用服务端筛选
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  
  // 新增：错误状态
  error?: Error | null;
  
  // 修正：分页明确为 1-based
  currentPage: number;           // 1-based，与后端一致
}
```

### 2.3 分页索引统一声明

在 Master Spec 和 TASK-1.2 中明确声明：**所有分页使用 1-based 索引**，与现有代码和后端保持一致。移除所有"需确认"的表述。

### 2.4 Next.js App Router 错误处理方案

**替代 TASK-3.6 的全局 class component 方案**：
- 全局错误：使用 `app/error.tsx`（Next.js 原生支持）
- Dashboard 模块级错误：使用 `app/(admin)/admin/error.tsx` 或各 segment 的 `error.tsx`
- API 错误 toast：在 `api.ts` 的 `request` 函数中统一拦截（已在代码中部分实现，需补充 `toast.error`）

### 2.5 瀑布流简化方案

**替代 TASK-4.2 的 masonry grid 方案**：
- 主方案：CSS `columns: 3` / `columns: 2` / `columns: 1`，配合 `break-inside: avoid`
- 优点：无需任何库，浏览器原生支持，React 19 零兼容风险
- 缺点：顺序是纵向填充而非横向，但对相册场景可接受

### 2.6 图片上传接口明确

当前 `api.ts` 只有单文件上传：
```typescript
upload: <T>(path: string, file: File) => { ... }
```

**建议**：在 TASK-2.2 开始前确认后端是否支持：
1. 批量上传（multipart/form-data 多个 file 字段）
2. 还是只支持单文件，前端需要串行/并发调用
3. 上传进度是否支持（需要 `XMLHttpRequest` 替代 `fetch`）

### 2.7 framer-motion 版本与使用范围确认

**位置**: Master Spec §6.3、TASK-4.1、TASK-4.3、TASK-5.1

**问题**: Master Spec 和多个 Task 依赖 `framer-motion`，但 TECH-REVIEW 曾建议不引入，造成决策矛盾。

**决策**:
1. **统一引入 `framer-motion`**：多个核心 Task（TASK-4.1 视图切换动画、TASK-4.3 降级方案、TASK-5.1 Drawer 动画）已依赖，且 `framer-motion@11.13.5+` 已支持 React 19
2. **版本约束**: 必须使用 `framer-motion@^11.13.5`（首个支持 React 19 的版本），Master Spec 从 `v11.x` 更新为 `^11.13.5`
3. **使用范围**: 仅用于必要的视图切换和 Drawer 动画，不滥用

**验证**: `npm info framer-motion@11.13.5 peerDependencies` → 包含 `react: '^18.0.0 || ^19.0.0'`

---

## 3. 前置条件（开始实现前必须确认）

### Phase 1 启动前

| # | 确认项 | 确认方式 | 阻塞任务 |
|---|--------|---------|---------|
| 1 | `@tanstack/react-table` v8 在 React 19 下安装和构建正常 | `npm install @tanstack/react-table && npm run build` | TASK-1.1 |
| 2 | 后端分页 `current` 参数确认为 1-based | 查看现有 `articles/page.tsx` 和后端 `PageResult` | TASK-1.2 |
| 3 | 后端是否支持服务端排序/筛选参数 | 检查后端 API 文档或代码 | TASK-1.3 |

### Phase 2 启动前

| # | 确认项 | 确认方式 | 阻塞任务 |
|---|--------|---------|---------|
| 4 | `zod` 和 `react-hook-form` 在 React 19 下兼容 | `npm install zod react-hook-form && npm run build` | TASK-2.6 |
| 5 | `@uiw/react-md-editor` 的 `commands` API 是否支持完全自定义工具栏 | 阅读源码或创建 PoC | TASK-2.1 |
| 6 | 后端图片上传 API 支持批量还是仅单文件 | 后端确认或抓包 | TASK-2.2 |
| 7 | 后端图片上传是否返回进度（或前端用串行模拟） | 后端确认 | TASK-2.2 |

### Phase 3 启动前

| # | 确认项 | 确认方式 | 阻塞任务 |
|---|--------|---------|---------|
| 8 | 后端是否能提供 Dashboard 聚合数据（recentActivities/topArticles/todoList） | 与后端协商 | TASK-3.2 |
| 9 | `swr` 或确认使用 `useEffect` + `useState` | 技术决策 | TASK-3.2 |
| 10 | 后端 `viewList` 是否支持 `timeRange` 参数 | 后端确认 | TASK-3.2 |

### Phase 4 启动前

| # | 确认项 | 确认方式 | 阻塞任务 |
|---|--------|---------|---------|
| 11 | `yet-another-react-lightbox@^3.21.8` 在 React 19 下安装和构建正常 | `npm install yet-another-react-lightbox@^3.21.8 && npm run build` | TASK-4.3 |
| 12 | 后端是否支持批量删除图片（`DELETE []int`） | 后端确认 | TASK-4.4 |
| 13 | 浏览器是否支持 `grid-template-rows: masonry` | Chrome/Safari DevTools 测试 | TASK-4.2 |

---

## 4. 替代方案（主要技术风险的备选）

### 4.1 Lightbox 方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **A. yet-another-react-lightbox@^3.21.8** | 功能完整（缩放/拖拽/键盘），**已支持 React 19** | 需要升级到较新版本 | 首选方案 |
| **B. shadcn Dialog + CSS transform** | 零新增依赖，完全可控 | 需自行实现缩放/拖拽 | 方案 A 失败时的降级 |
| **C. photoswipe** | 原生 JS，无 React 版本依赖 | 需要写 React wrapper | 方案 A/B 都不满意时 |

**推荐**: 先做方案 A 的兼容性验证（30 分钟），失败则立即切换到方案 B。

### 4.2 瀑布流方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **A. CSS `columns`** | 零依赖，性能好 | 纵向填充，非 Masonry 标准横向 | 推荐首选 |
| **B. `grid-template-rows: masonry`** | 标准 Masonry 布局 | 旧浏览器不支持 | 浏览器支持度足够时 |
| **C. `react-masonry-css`** | 成熟的 React 方案 | 已 4 年未更新，React 19 风险 | 不建议 |

**推荐**: 直接使用方案 A（CSS columns），在 TASK-4.2 中移除 `react-masonry-css` 备选。

### 4.3 Markdown 编辑器工具栏方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **A. `@uiw/react-md-editor` commands API** | 无迁移成本 | 工具栏 UI 定制受限 | 验证通过后首选 |
| **B. 外部独立工具栏 + ref 操作编辑器** | 完全可控 | 需要维护编辑器 ref 同步 | 方案 A 受限时 |
| **C. 迁移到 Tiptap** | 功能强大，可扩展 | 迁移成本高，需重写编辑器 | 长期方案，不在本期 |

**推荐**: 先验证方案 A（1 天预研），如果 commands API 能满足 80% 需求就使用；不能满足则使用方案 B。

### 4.4 全局搜索方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **A. 完整 Command Palette** | 功能丰富 | 需要前端缓存文章/评论数据 | 工期充裕时 |
| **B. 纯快捷导航面板** | 简单可靠 | 不能搜索内容 | 工期紧张时 |

**推荐**: TASK-3.5 标记为"可选增强"，建议直接实现方案 B（固定快捷操作 + 最近访问），不做文章/评论搜索（避免缓存大量数据）。

---

## 5. 代码质量问题汇总

### 5.1 `any` 类型使用

| 位置 | 代码 | 建议 |
|------|------|------|
| TASK-1.2 | `columns: ColumnDef<TData, any>[]` | 使用 `ColumnDef<TData, unknown>[]` 或泛化 |
| TASK-2.2 | `e.clipboardData.files` 未类型化 | 使用 `ClipboardEvent` 类型 |

### 5.2 缺失的状态处理

| 组件/页面 | 缺失状态 | 影响 |
|----------|---------|------|
| DataTable | `error` 状态 | API 失败时无法显示错误 UI |
| Dashboard | 模块级错误状态 | 单模块失败导致整页空白 |
| 文章编辑页 | 网络断开状态 | 离线时自动保存失败无提示 |

### 5.3 API 契约不一致

| Spec 声明 | 实际代码 | 问题 |
|----------|---------|------|
| Phase 2 README: `POST /api/v1/admin/upload` | `api.ts` 只有 `upload(path, file)` | 路径未预定义，返回值类型未定义 |
| TASK-3.2: `useSWR` 重新验证 | `package.json` 无 `swr` | 示例代码无法运行 |

---

## 6. 审查结论

| 维度 | 评估 | 说明 |
|------|------|------|
| **技术可行性** | ⚠️ **有条件通过** | React 19 兼容性需要逐个验证 |
| **设计完整性** | ⚠️ | 缺少错误状态、网络状态、分页索引不明确 |
| **实现可行性** | ⚠️ | 工期偏乐观，建议上调 20-30% |
| **项目适配性** | ✅ | 与现有技术栈方向一致 |
| **依赖风险** | 🔴 | 6 个新依赖均未安装，1 个明确不兼容 React 19 |

### 启动建议

1. **Phase 1 可以启动**，但必须先完成前置条件 1-3
2. **Phase 2 可以启动**，但必须先完成前置条件 4-7
3. **Phase 3 建议延后**，直到前置条件 8-10 确认（特别是 Dashboard API）
4. **Phase 4 建议延后**，直到前置条件 11-13 确认（特别是 Lightbox 兼容性）
5. **Phase 5 按原计划执行**，但需在各 Phase 中同步考虑移动端，而非全部堆到最后

---

*审查完成时间: 2026-05-03*
*审查人: 技术架构师*
