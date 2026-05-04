# Task 2.1: Markdown 编辑器工具栏

> **Task ID**: TASK-2.1
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: 无（依赖基础编辑器 `@uiw/react-md-editor`）

## 1. Background

当前文章编辑页使用 `@uiw/react-md-editor` v4.1.0 的默认工具栏，功能极简（仅加粗、斜体、删除线、无序列表、有序列表），缺少标题、引用、代码块、链接、图片、分割线等常用功能按钮。管理员需要手动输入 Markdown 语法，操作效率低下。

Master Spec §6.2 要求渐进增强现有编辑器（ADR-002），不替换编辑器内核，仅扩展工具栏。

## 2. Goal

为 `@uiw/react-md-editor` 创建自定义工具栏组件，提供 10+ 个格式化按钮，支持键盘快捷键，将常用 Markdown 操作从"手动输入语法"升级为"一键操作"。

## 3. Scope

### In Scope

- 自定义工具栏组件（`MarkdownToolbar`）
- 10+ 个按钮：加粗、斜体、标题（H1-H6）、无序列表、有序列表、引用块、行内代码、代码块、链接、图片（插入占位符）、水平分割线
- 键盘快捷键映射（如 `Ctrl+B` 加粗、`Ctrl+I` 斜体、`Ctrl+K` 链接等）
- 工具栏按钮 hover tooltip 提示快捷键
- 选中文本时自动包裹/取消包裹语法
- 未选中文本时插入占位符并将光标定位到占位符处

### Out of Scope

- 更换编辑器内核（保持 `@uiw/react-md-editor`）
- 所见即所得（WYSIWYG）模式
- 实时预览同步滚动优化（Phase 1 已完成）
- 数学公式编辑（KaTeX 支持）
- 表格图形化编辑

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 撰写/编辑文章时使用工具栏快速格式化文本 |

## 5. Behavior Contract

### 5.1 状态机

```
[文本未选中]
    ↓ 点击按钮
[在光标位置插入占位符语法，光标定位到占位符内]

[文本已选中]
    ↓ 点击按钮
[用对应 Markdown 语法包裹选中文本]
    ↓ 再次点击同一按钮
[移除包裹语法，恢复原始文本]
```

### 5.2 快捷键映射

| 快捷键 | 功能 | 冲突处理 |
|--------|------|----------|
| `Ctrl+B` / `Cmd+B` | 加粗 | 浏览器默认行为被阻止 |
| `Ctrl+I` / `Cmd+I` | 斜体 | 浏览器默认行为被阻止 |
| `Ctrl+K` / `Cmd+K` | 插入链接 | 浏览器默认行为被阻止 |
| `Ctrl+Shift+K` | 行内代码 | 无冲突 |
| `Ctrl+Shift+C` | 代码块 | 与 Chrome DevTools 冲突，fallback 到按钮 |
| `Ctrl+Shift+1` ~ `6` | H1 ~ H6 | 无冲突 |
| `Ctrl+Shift+.` | 引用块 | 无冲突 |
| `Ctrl+Shift+7` | 有序列表 | 无冲突 |
| `Ctrl+Shift+8` | 无序列表 | 无冲突 |
| `Ctrl+Shift+-` | 水平分割线 | 无冲突 |

### 5.3 按钮分组

```
[文本样式]  [段落样式]  [插入]  [列表]
  B  I       H1-H6      Link   • List
  ~~         > Quote    Image  1. List
             ` Code     ---
             ``` Block
```

## 6. Acceptance Criteria

- [ ] AC-1: 工具栏渲染 12 个功能按钮，按语义分组，间距符合 shadcn/ui 设计规范
- [ ] AC-2: 每个按钮有 lucide-react 图标和 hover tooltip 显示快捷键
- [ ] AC-3: 未选中文本时点击按钮，在光标处插入占位符（如 `**bold**`），光标定位到占位符内
- [ ] AC-4: 选中文本时点击按钮，用对应语法包裹选中文本；再次点击取消包裹
- [ ] AC-5: 所有快捷键在编辑器获得焦点时生效，不触发浏览器默认行为
- [ ] AC-6: 标题按钮点击后，当前行开头插入 `# `，再次点击增加 `#` 数量（最多 6 个）
- [ ] AC-7: 代码块按钮在未选中文本时插入 `\n```\n\n```\n` 并将光标定位到中间空行
- [ ] AC-8: 水平分割线按钮在当前行插入 `\n---\n`
- [ ] AC-9: 工具栏在深色模式下正常显示，图标颜色跟随主题
- [ ] AC-10: 工具栏支持键盘导航（Tab 键在按钮间移动，Enter/Space 触发）

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：管理员打开文章编辑页，看到完整的工具栏按钮<br>Given 管理员在文章编辑页<br>When 页面加载完成<br>Then 工具栏渲染 12 个分组按钮 | `MarkdownToolbar.test.tsx`: 渲染测试，断言按钮数量和分组 | E2E: `editor/toolbar.spec.ts` - 截图对比工具栏 | 人工检查 UI | Completed |
| AC-2 | 场景：管理员 hover 按钮看到快捷键提示<br>Given 管理员 hover 到加粗按钮<br>When 等待 300ms<br>Then tooltip 显示 "加粗 (Ctrl+B)" | `MarkdownToolbar.test.tsx`: 模拟 hover，断言 tooltip 内容 | E2E: `editor/toolbar.spec.ts` - hover 每个按钮验证 tooltip | 人工检查 tooltip | Completed |
| AC-3 | 场景：未选中文本插入占位符<br>Given 编辑器获得焦点且光标在空行<br>When 点击加粗按钮<br>Then 插入 `**bold**` 且光标在 bold 内 | `useMarkdownEditor.test.ts`: 模拟无选区点击，断言值和光标位置 | E2E: `editor/toolbar.spec.ts` - 点击按钮验证内容变化 | 运行 E2E | Completed |
| AC-4 | 场景：选中文本后加粗并取消<br>Given 编辑器中有文本 "hello" 且已选中<br>When 点击加粗按钮<br>Then 内容变为 "**hello**"<br>When 再次点击加粗按钮<br>Then 内容恢复为 "hello" | `useMarkdownEditor.test.ts`: 模拟选区操作，断言包裹/取消包裹逻辑 | E2E: `editor/toolbar.spec.ts` - 选中操作验证 | 运行 E2E | Completed |
| AC-5 | 场景：快捷键生效<br>Given 编辑器获得焦点<br>When 按下 Ctrl+B<br>Then 执行加粗操作（阻止默认行为） | `useMarkdownShortcuts.test.ts`: 模拟键盘事件，断言回调调用 | E2E: `editor/toolbar.spec.ts` - 键盘快捷键测试 | 运行 E2E | Completed |
| AC-6 | 场景：标题按钮递增<br>Given 光标在 "正文" 行首<br>When 点击 H1 按钮<br>Then 行变为 "# 正文"<br>When 再次点击<br>Then 行变为 "## 正文"（最多 6 级） | `useMarkdownEditor.test.ts`: 模拟标题按钮多次点击 | E2E: `editor/toolbar.spec.ts` - 标题级别递增 | 运行 E2E | Completed |
| AC-7 | 场景：代码块插入占位符<br>Given 光标在空行<br>When 点击代码块按钮<br>Then 插入代码块模板，光标在中间行 | `useMarkdownEditor.test.ts`: 断言代码块占位符和光标位置 | E2E: `editor/toolbar.spec.ts` - 代码块插入验证 | 运行 E2E | Completed |
| AC-8 | 场景：分割线插入<br>Given 光标在文本中间<br>When 点击分割线按钮<br>Then 当前行被换行并插入 `---` | `useMarkdownEditor.test.ts`: 断言分割线插入位置 | E2E: `editor/toolbar.spec.ts` - 分割线验证 | 运行 E2E | Completed |
| AC-9 | 场景：深色模式工具栏<br>Given 系统主题为深色<br>When 打开文章编辑页<br>Then 工具栏背景、图标颜色适配深色主题 | 视觉回归测试（chromatic/percy） | E2E: `editor/toolbar.spec.ts` - 深色模式截图 | 人工检查 | Completed |
| AC-10 | 场景：键盘导航工具栏<br>Given 工具栏获得焦点<br>When 按 Tab 键<br>Then 焦点在按钮间移动<br>When 按 Enter<br>Then 触发按钮操作 | `MarkdownToolbar.test.tsx`: 键盘导航测试 | E2E: `editor/toolbar.spec.ts` - Tab 导航 | 运行 E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| `@uiw/react-md-editor` 自定义工具栏 API 限制 | 中 | 需要 fork 或换编辑器 | ADR-002 已确认可定制；预研 API；Tiptap 备选 |
| 快捷键与浏览器/系统冲突 | 中 | 部分快捷键失效 | 使用常见编辑器快捷键约定；冲突时降级到菜单操作 |
| 光标定位在复杂语法中出错 | 低 | 用户体验差 | 充分单元测试覆盖各种边界情况 |
| 多语言输入法与快捷键冲突 | 低 | 中文输入时误触发 | 检测 composition event，输入法激活时忽略快捷键 |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/components/editor/__tests__/MarkdownToolbar.test.tsx`
- **文件**: `frontend/src/hooks/__tests__/useMarkdownEditor.test.ts`
- **文件**: `frontend/src/hooks/__tests__/useMarkdownShortcuts.test.ts`
- **覆盖率目标**: 分支覆盖率 ≥ 80%
- **测试重点**: 光标操作、语法包裹/取消、快捷键拦截

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/toolbar.spec.ts`
- **场景**: 工具栏渲染、按钮操作、快捷键、深色模式、键盘导航
- **截图对比**: 工具栏在明暗主题下的视觉回归

### 9.3 手动验证

1. 打开文章编辑页，确认工具栏显示正常
2. 逐一测试每个按钮的功能
3. 测试快捷键（确保不触发浏览器默认行为）
4. 切换深色/浅色模式，确认工具栏适配
5. 使用 Tab 键在工具栏按钮间导航

## 10. Completion Notes

### 实际实现组件/文件路径
- 工具栏组件: `frontend/src/components/editor/MarkdownToolbar.tsx`
- 编辑器逻辑 Hook: `frontend/src/hooks/useMarkdownEditor.ts`
- 快捷键 Hook: `frontend/src/hooks/useMarkdownShortcuts.ts`
- 占位符文本使用 `i18n` 键 `editor.placeholder.*`

### 关键决策
- **保持编辑器内核不变**: 严格遵循 ADR-002，仅扩展 `@uiw/react-md-editor` 的工具栏，不替换编辑器内核
- **原生 API 扩展**: 利用编辑器提供的 `textarea` ref 和 API 直接操作文本和选区，避免 fork 编辑器
- **快捷键拦截策略**: 优先使用常见编辑器快捷键约定，与浏览器冲突时使用 `preventDefault()` 并降级到按钮操作

### 遇到的问题及解决方案
- **光标定位在复杂语法中出错**: 通过充分单元测试覆盖各种边界情况（代码块、列表嵌套等），使用 `setSelectionRange` 精确定位光标
- **多语言输入法与快捷键冲突**: 监听 `compositionstart`/`compositionend` 事件，在输入法激活时忽略快捷键，避免中文输入时误触发
- **标题按钮递增逻辑复杂**: 通过正则匹配当前行标题级别，实现点击循环递增（最多 6 级）

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- 单元测试覆盖率: 分支覆盖率 ≥ 80%

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03