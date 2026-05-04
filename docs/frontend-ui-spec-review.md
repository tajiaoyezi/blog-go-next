# blog-go-next 前端 UI 优化规格文档审查报告

> **审查日期**: 2026-05-03
> **审查人**: AI 架构审查
> **审查范围**: Master Spec + Phase 1~5 全部规格文档
> **技术栈**: Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui + Zustand

---

## 一、关键问题（Critical）

### 1. Phase-2: MDEditor 工具栏 API 假设不成立
**位置**: `phase-2/README.md` §2.1 / §4.1
**问题**: 假设 `@uiw/react-md-editor` 支持 `toolbars` 属性传入自定义按钮数组，但该库**不支持**这种自定义方式。其 toolbar 是内置的字符串枚举，无法注入 React 组件或自定义行为。
**影响**: 整个工具栏增强和图片上传功能可能无法实现。
**建议**: 调研 `commands` API（极有限）或立即启动 ADR-002 中的 Tiptap 迁移方案。

### 2. Phase-1: 表格状态丢失 + 缺少服务端搜索
**位置**: `phase-1/README.md` §4.2 / §2.2
**问题**: 使用 `useState` 管理表格状态，页面刷新或返回时排序/筛选/分页全部丢失。且 `onSearch` 回调未区分客户端过滤 vs 服务端搜索。
**影响**: 大数据量时客户端搜索性能差，用户体验断裂。
**建议**:
- 表格状态持久化到 URL query params（`?page=2&sort=title&order=desc`）
- 定义明确规则：全局搜索走服务端 API，列筛选可走客户端

### 3. Phase-4: 瀑布流 CSS Grid 方案不可行
**位置**: `phase-4/README.md` §4.2 / Task 4.2
**问题**: `grid-auto-rows: 10px` + `grid-row: span var(--row-span)` 需要**预先知道图片高度**才能计算 span，但 API 返回的图片尺寸不可控。
**影响**: 布局会严重错位。
**建议**: 直接使用 `react-masonry-css`（已在附录提及）或 `react-virtualized` Masonry，删除有问题的纯 CSS 方案。

### 4. Phase-3: Dashboard 聚合 API 大概率不存在
**位置**: `phase-3/README.md` §3.2 / §4.1
**问题**: Dashboard 需要 `articleTrend`, `recentActivities`, `topArticles`, `todoList` 等聚合数据，但后端只有基础 CRUD。
**影响**: 风险登记册中说"概率中"，实际应为**高**。整个 Phase 3 依赖后端新增接口。
**建议**: 将 Dashboard API 协商前置到 Phase 1 启动前，或定义降级方案（仅显示基础统计）。

---

## 二、改进建议（Important）

### 5. 缺少数据获取与缓存层规范
**位置**: Master Spec §3.1 / 所有 Phase
**问题**: 未使用 SWR / React Query / TanStack Query，全部使用手动 `fetch` + `useState`。
**影响**: 重复造轮子，无缓存、无重试、无去重、无乐观更新。
**建议**:
- 引入 `@tanstack/react-query`（与 TanStack Table 同生态）
- 封装 `useApiQuery`, `useApiMutation` hooks，统一处理 `{code, flag, message, data}` 响应格式

### 6. 自研表单验证不如现有方案
**位置**: `phase-2/README.md` §2.6 / §4.3
**问题**: 自研 `useFormValidation` hook，功能覆盖度不如 `react-hook-form` + `zod`。
**影响**: 开发成本高，边界情况处理不全（数组字段、嵌套对象、异步验证）。
**建议**: 使用 `react-hook-form` + `zod` 进行 schema 验证，与 shadcn/ui 表单集成最佳实践一致。

### 7. Phase-5 表格移动端方案粗糙
**位置**: `phase-5/README.md` §4.3
**问题**: `hidden md:table-cell` 隐藏列会导致表格结构破坏，且 `overflow-x-auto` 在触摸设备上体验差。
**影响**: 移动端表格可用性差。
**建议**: 移动端使用 Card 列表视图替代表格（参考 Gmail 移动端），而非横向滚动表格。

### 8. 错误边界应前置到 Phase 1
**位置**: `phase-3/README.md` §3.6
**问题**: 错误边界放在 Phase 3，但 Phase 1 的 DataTable 和 Phase 2 的编辑器都容易出错。
**建议**: 将 ErrorBoundary 作为基础设施提到 Phase 1 之前完成。

### 9. 图片未使用 Next.js Image 优化
**位置**: `phase-4/README.md` / 所有涉及图片的 Phase
**问题**: 全部使用原生 `<img>`，未用 `next/image`。
**影响**: 失去自动 WebP 转换、响应式尺寸、懒加载优化。
**建议**: 统一封装 `OptimizedImage` 组件，内部使用 `next/image`，外部保持统一 API。

### 10. 新增依赖列表不完整
**位置**: Master Spec §2.3
**遗漏**:
- Phase 2 需要 `react-dropzone`（已列）但未提及 `react-hook-form`
- Phase 3 的图表依赖 `recharts` 已在技术栈但未列
- Phase 4 的 `react-masonry-css` 未列
- 建议统一引入的 `@tanstack/react-query` 未列

---

## 三、遗漏点（Missing）

### 11. URL 状态同步
所有 Phase 均未提及：浏览器前进/后退、刷新后保留表格状态。这是管理后台刚需。

### 12. 权限控制集成
后端有 RBAC（Casbin），但前端 Spec 中**没有任何页面/按钮级别的权限控制设计**。应定义 `usePermission` hook 和 `<PermissionGuard>` 组件。

### 13. 批量删除 API 契约
Phase 1 提到批量删除调用 `DELETE /admin/articles`，但 CLAUDE.md 说明 DELETE 接受 `[]int` JSON body。需确认批量删除的 body 格式和 loading 状态。

### 14. 自动保存冲突处理
Phase 2 的 `useAutoSave` 将草稿存 localStorage，但未定义：
- 多标签页同时编辑同一篇文章的冲突检测
- 草稿有效期/清理策略
- 用户主动放弃编辑时是否清除草稿

### 15. 全局搜索数据源
Phase 3 的全局搜索需要索引文章、评论、页面，但未定义：
- 搜索是前端内存搜索还是调用后端搜索 API（Elasticsearch 已部署但未接入 IK）
- 搜索结果的分页/截断策略

### 16. 图片上传后端限制
CLAUDE.md 已知限制：上传"无病毒扫描，大图无自动压缩"。但 Phase 2/4 均未提及前端是否需要：
- 图片压缩（canvas resize）后再上传
- 上传前 MIME 嗅探与扩展名白名单

### 17. 深色模式 Skeleton 适配
Phase 3 提到 Skeleton 适配深色模式，但未给出具体实现方案（shadcn Skeleton 默认已适配，但自定义 shimmer 动画需要 `dark:` 变体）。

---

## 四、风险评估

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|----------|
| MDEditor 无法定制工具栏 | **高** | Phase 2 延期 2-3 天 | 预研 Tiptap 迁移，或降级为简版工具栏 |
| Dashboard API 不存在 | **高** | Phase 3 无法交付 | 前置 API 协商，准备 Mock 数据降级 |
| 大数据量表格卡顿 | 中 | Phase 1 体验差 | 引入 `@tanstack/react-virtual`，延迟到 Phase 1 后期 |
| 移动端表格体验差 | 中 | Phase 5 返工 | 提前在 Phase 1 设计 Card 视图备用 |
| 图片上传后端不支持 | 高 | Phase 2/4 阻塞 | 立即确认后端 upload 接口状态 |
| 多 Phase 并行依赖冲突 | 低 | 构建失败 | 所有新增依赖在 Phase 1 统一评估 |

---

## 五、优先行动项

1. **立即**: 验证 `@uiw/react-md-editor` 的 `commands` API 能力，决定是否启动 Tiptap 迁移
2. **立即**: 与后端确认 Dashboard 聚合接口和 Upload 接口状态
3. **Phase 1 启动前**: 确定数据获取方案（手动 fetch vs React Query）
4. **Phase 1 启动前**: 统一 URL 状态持久化规范
5. **Phase 1 启动前**: 设计权限控制组件

---

## 六、审查方法论

本次审查基于以下维度：
1. **技术选型合理性**: 评估依赖选择、框架使用是否匹配现有技术栈
2. **架构可行性**: 检查组件分层、状态管理、数据流是否合理
3. **性能风险**: 识别大数据量、频繁渲染、移动端场景的性能隐患
4. **技术约束**: 验证是否符合 Next.js 16 App Router、React 19、TypeScript 5 的约束
5. **遗漏点**: 发现 spec 中缺失的关键技术细节和边界情况
