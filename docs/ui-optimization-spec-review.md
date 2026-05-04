# blog-go-next 前端 UI 优化 Spec 代码审查报告

> **审查日期**: 2026-05-03
> **审查范围**: Master Spec + Phase 1~5 规格文档 + 现有代码上下文
> **审查重点**: 接口完整性、边界情况、状态管理、API 契约、实现风险

---

## 1. 接口问题

### P0 - 类型不安全（多处使用 `any`）

| 位置 | 问题 | 影响 |
|------|------|------|
| `phase-1/README.md:97` | `ColumnDef<TData, any>[]` | 丧失类型推断，列定义无法校验 data 类型 |
| `phase-1/README.md:147` | `BatchAction.onClick: (selectedRows: any[]) => void` | 批量操作回调无类型安全 |
| `phase-1/README.md:148` | `BatchAction.disabled?: (selectedRows: any[]) => boolean` | 同上 |
| `phase-2/README.md:66` | `MDEditorToolbarProps.editorRef: React.RefObject<any>` | MDEditor 实例无类型 |
| `phase-2/README.md:315` | `ValidationRule.validator?: (value: any) => string \| undefined` | 表单值无类型约束 |

**建议**：使用泛型参数 `TData` 替代 `any`，`validator` 使用 `(value: unknown)`。

### P1 - 接口字段缺失

| 位置 | 缺失 | 说明 |
|------|------|------|
| `phase-1/README.md:94` | `error?: Error \| null` | API 失败时无错误展示机制，现有代码用 toast 但组件层未暴露 |
| `phase-1/README.md:94` | `manualPagination?: boolean` | 服务端分页场景必须手动控制，否则 TanStack Table 默认客户端分页 |
| `phase-1/README.md:94` | `manualSorting?: boolean` | 服务端排序同理 |
| `phase-1/README.md:94` | `onRowClick?: (row: TData) => void` | 常见需求（如点击标题进入详情） |
| `phase-3/README.md:56` | `format?: (value: number) => string` | 统计卡片数值格式化（如 1200 → "1.2k"） |
| `phase-3/README.md:294` | `placeholder?: string` | CommandPalette 缺少搜索占位符 |
| `phase-4/README.md:226` | `onUpload` 返回 `Promise<void>` | 应返回上传结果 `{url: string; name: string}[]`，否则无法获取 URL |

### P1 - 类型定义错误

| 位置 | 问题 | 说明 |
|------|------|------|
| `phase-3/README.md:300` | `SearchResult.id: string` | 后端 ID 通常为 `number`，与现有 `Article.id` 等不一致 |
| `phase-4/README.md:122` | `Photo.width/height: number` | 现有后端 API 未确认返回图片尺寸，可能需前端计算或移除 |
| `phase-1/README.md:100` | `pageCount?: number` | 后端返回 `count`（总记录数），需转换：`pageCount = Math.ceil(count / size)` |

---

## 2. 边界遗漏

### P0 - 分页索引冲突

**`phase-1/README.md:103`** 定义 `currentPage?: number`（默认 0），但：
- 现有代码 `articles/page.tsx:53` 使用 `useState(1)`（1-based）
- API 调用传递 `current=${page}`（1-based）
- **后端 `PageResult.current` 实际行为待确认**

**风险**：若后端是 0-based，现有代码分页将偏移一页；若后端是 1-based，spec 文档描述错误。

### P1 - 未处理的 Edge Case

| 场景 | 位置 | 遗漏 |
|------|------|------|
| API 错误 | `phase-1` 全局 | DataTable 只有 `loading` 无 `error`，失败时骨架屏消失后显示空状态（误导） |
| 空数组 vs null | `phase-1` 全局 | `data: TData[]` 未区分 `[]` 和 `undefined`，初始状态可能闪烁 |
| localStorage 满 | `phase-2/README.md:242` | `useAutoSave` 未处理 `QuotaExceededError` |
| 草稿恢复冲突 | `phase-2/README.md:242` | 用户编辑已有文章时，草稿 key 如何与文章 id 关联未定义 |
| 图片 404 | `phase-4/README.md:122` | 瀑布流中图片加载失败无 fallback 处理 |
| 全选翻页 | `phase-1/README.md:119` | 服务端分页下，全选后翻页，已选行是否保持？（通常应支持跨页选择） |
| 上传中断 | `phase-2/README.md:107` | 网络中断/页面关闭时的上传状态未处理 |
| 浏览器限制 | `phase-2/README.md:259` | `beforeunload` 自定义消息已被现代浏览器忽略，只能使用默认提示 |

---

## 3. 状态问题

### P1 - 状态管理设计缺陷

| 位置 | 问题 | 影响 |
|------|------|------|
| `phase-1/README.md:478` | "使用 React useState 管理表格状态" | 8 个列表页重复实现排序/筛选/分页逻辑，未复用 Zustand（项目中已有） |
| `phase-1/README.md:119` | `onSelectionChange?: (selectedRows: TData[]) => void` | 服务端分页下翻页丢失选择状态，需维护 `rowSelection` + `selectedIds` 双状态 |
| `phase-2/README.md:242` | `useAutoSave` 的 `data: T` | 引用类型对象浅比较无法检测变化，可能过度保存或漏保存 |
| `phase-3/README.md:396` | 使用 `useSWR` | **未在 `package.json` 中安装**，spec 也未列入新增依赖 |

### P2 - 不必要的复杂度

| 位置 | 问题 | 建议 |
|------|------|------|
| `phase-1/README.md:94` | 同时支持受控和非受控 | 增加组件复杂度，建议默认受控，用 hook 封装非受控场景 |
| `phase-2/README.md:306` | 自研 `useFormValidation` | 与 shadcn/ui 的 Form 组件（基于 react-hook-form）重复，建议复用现有方案 |

---

## 4. API 不匹配

### P0 - 后端接口不存在或不确定

| Spec 定义 | 现有后端 | 状态 |
|-----------|----------|------|
| `GET /api/v1/admin?timeRange=7d` | `phase-3/README.md:388` | **不存在** - 后端无 Dashboard 数据聚合接口 |
| `POST /api/v1/upload` | `phase-2/README.md:431` | **未确认** - 现有 `api.ts:112` 有 `upload` 方法但路径/响应格式未验证 |
| `Photo.width/height` | `phase-4/README.md:127` | **不确定** - 需确认后端相册 API 是否返回图片尺寸 |
| `Album.photoCount` | `phase-4/README.md:79` | **不确定** - 后端可能返回 `count` 或其他字段名 |

### P1 - 接口契约不一致

| 位置 | Spec 定义 | 现有代码 | 冲突 |
|------|-----------|----------|------|
| `phase-1/README.md:161` | `current: number`（从0开始） | `articles/page.tsx:53` 使用 1 | 分页索引起始值冲突 |
| `phase-1/README.md:305` | 批量删除 `DELETE /admin/articles` | `articles/page.tsx:88` 相同 | ✅ 一致 |
| `phase-1/README.md:305` | 批量删除 body: `[]int` | `api.ts:107` body 序列化为 JSON | ✅ 一致，但需确认后端解析 |
| `phase-2/README.md:431` | 图片上传 `POST /api/v1/upload` | `api.ts:112` 路径未硬编码 | 需前端统一使用 `/upload` |

### P1 - 15个 Admin 路由为 Placeholder

`CLAUDE.md` 明确指出 **15 个 admin 路由（users/roles/menus/resources）返回 501**。Phase 3 的 Dashboard 若依赖这些接口（如待办提醒中的"待审核评论"需用户权限接口），将无法实现。

---

## 5. 实现风险

### P0 - 高风险

| 风险 | 位置 | 说明 |
|------|------|------|
| **分页 0-based/1-based 冲突** | `phase-1` 全局 | TanStack Table 内部使用 0-based，现有代码和后端可能使用 1-based，需写转换层 |
| **Dashboard API 缺失** | `phase-3/README.md:388` | 后端无聚合接口，Phase 3 大部分功能需 mock 或推动后端开发 |
| **useSWR 未安装** | `phase-3/README.md:396` | 示例代码使用 `useSWR`，但 `package.json` 无此依赖，需改为 `useEffect` + `useState` 或安装 |
| **MDEditor 工具栏定制限制** | `phase-2/README.md:407` | `@uiw/react-md-editor` 的 `toolbars` 属性可能不支持完全自定义按钮样式和交互 |

### P1 - 中风险

| 风险 | 位置 | 说明 |
|------|------|------|
| **framer-motion 范围不足** | `phase-3/README.md:72` | 仅 Phase 3 列出，但 Skeleton shimmer、页面过渡、Toast 动画都可能需要 |
| **瀑布流性能** | `phase-4/README.md:137` | 大量图片（100+）时 CSS Grid 瀑布流或 `react-masonry-css` 可能卡顿，未规划虚拟滚动 |
| **react-masonry-css 兼容性** | `phase-4/README.md:320` | 该库与 React 19 / Next.js 16 的兼容性待验证 |
| **yet-another-react-lightbox 样式冲突** | `phase-4/README.md:305` | 需确认与 Tailwind CSS / shadcn/ui 的 z-index 和样式隔离 |

### P2 - 低风险

| 风险 | 位置 | 说明 |
|------|------|------|
| **组件文件行数限制** | `README.md:197` | "组件文件不超过 300 行" - DataTable 核心 + 工具栏 + 分页可能超标，需提前规划拆分 |
| **Hook 职责单一** | `README.md:198` | `useAutoSave` 同时处理定时保存、离开保存、手动保存，可能超标 |

---

## 总结

| 类别 | P0 | P1 | P2 |
|------|----|----|----|
| 接口问题 | 6 | 7 | 0 |
| 边界遗漏 | 2 | 8 | 0 |
| 状态问题 | 0 | 4 | 2 |
| API 不匹配 | 4 | 3 | 0 |
| 实现风险 | 4 | 3 | 2 |

### 建议优先处理

1. **确认后端分页 `current` 字段是 0-based 还是 1-based**（影响所有列表页）
2. **确认后端是否有 Dashboard 聚合接口**，否则 Phase 3 需降级为 mock
3. **移除 `any` 类型**，改用泛型
4. **统一安装 `useSWR` 或改用现有方案**
5. **为 DataTable 添加 `error` 和 `manualPagination` 属性**
