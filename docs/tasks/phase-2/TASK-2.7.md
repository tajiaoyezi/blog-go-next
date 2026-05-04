# Task 2.7: 文章编辑页集成

> **Task ID**: TASK-2.7
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: TASK-2.1, TASK-2.2, TASK-2.3, TASK-2.4, TASK-2.5, TASK-2.6

## 1. Background

Phase 2 的前 6 个 Task 分别实现了独立的编辑器增强功能（工具栏、图片上传、封面图上传、智能标签、自动保存、表单验证）。本 Task 负责将所有功能集成到文章编辑页（`/admin/articles/edit` 和 `/admin/articles/new`），确保各组件协同工作，形成完整的文章编辑体验。

## 2. Goal

将 Phase 2 的所有编辑器增强功能集成到文章编辑页，替换现有简陋的编辑界面，实现功能完整、交互流畅、体验一致的文章编辑流程。

## 3. Scope

### In Scope

- 文章编辑页重构（`frontend/src/app/(admin)/articles/new/page.tsx` 和 `edit/[id]/page.tsx`）
- 集成 `MarkdownToolbar`（TASK-2.1）
- 集成 `ImageUploader`（TASK-2.2）到编辑器
- 集成 `CoverImageUploader`（TASK-2.3）到表单
- 集成 `SmartTagInput`（TASK-2.4）替换标签输入
- 集成 `useAutoSave`（TASK-2.5）草稿自动保存
- 集成表单验证和离开确认（TASK-2.6）
- 编辑器区域布局优化（工具栏 + 编辑器 + 预览并排/上下）
- 表单字段布局优化（响应式栅格）
- 集成测试：确保所有组件协同工作无冲突

### Out of Scope

- 后端 API 改造（复用现有 API）
- 文章列表页改造（Phase 1 已完成）
- 其他管理页面改造
- 新增文章编辑功能（如协同编辑、版本历史）

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 在完整的编辑界面中撰写、编辑、发布文章 |

## 5. Behavior Contract

### 5.1 页面布局

```
[页面标题] "新建文章" / "编辑文章"

[表单区域]
┌─────────────────────────────────────────────┐
│ 标题 [必填]                                  │
│ [SmartTagInput: 标签输入]                    │
│ [分类选择] [状态选择] [置顶/原创开关]        │
│ [CoverImageUploader: 封面图上传]             │
└─────────────────────────────────────────────┘

[编辑器区域]
┌─────────────────────────────────────────────┐
│ [MarkdownToolbar: 自定义工具栏]              │
├─────────────────────────────────────────────┤
│                                              │
│ [Markdown Editor]        | [实时预览]        │
│                          |                  │
│ (支持拖拽/粘贴图片上传)  |                  │
│                          |                  │
└─────────────────────────────────────────────┘

[操作栏]
[保存草稿] [预览] [发布文章]
```

### 5.2 组件交互矩阵

| 组件 A | 组件 B | 交互 |
|--------|--------|------|
| MarkdownToolbar | ImageUploader | 点击图片按钮触发图片上传对话框 |
| ImageUploader | Markdown Editor | 上传成功后向编辑器插入 `![alt](url)` |
| ImageUploader | useAutoSave | 上传状态变化时触发自动保存 |
| useAutoSave | 表单 | 保存表单当前值到 localStorage |
| DraftRecoveryDialog | 表单 | 恢复时填充表单所有字段 |
| SmartTagInput | 表单 | 标签变化同步到表单状态 |
| CoverImageUploader | 表单 | 上传成功/删除同步到表单封面图字段 |
| 表单验证 | 所有字段 | blur/change 时触发校验 |
| useUnsavedChanges | 路由/页面 | 拦截离开操作 |

### 5.3 数据流

```
用户操作 → 表单状态 (react-hook-form)
    ↓
各子组件通过 onChange 更新表单值
    ↓
表单 dirty 状态变化 → useAutoSave 监听 → 定时保存到 localStorage
    ↓
表单 dirty 状态变化 → useUnsavedChanges 监听 → 拦截离开操作
    ↓
用户点击发布 → 表单验证 → API 调用 → 清除草稿 → 跳转列表页
```

## 6. Acceptance Criteria

- [ ] AC-1: 文章编辑页渲染完整的自定义工具栏（12 个按钮）
- [ ] AC-2: 点击工具栏图片按钮打开图片上传组件
- [ ] AC-3: 拖拽/粘贴图片到编辑器区域触发批量上传
- [ ] AC-4: 封面图上传组件显示在表单中，支持拖拽/点击上传
- [ ] AC-5: 智能标签输入替换原有标签文本框，支持自动补全和新建
- [ ] AC-6: 编辑文章 30 秒后自动保存草稿，显示 Toast 提示
- [ ] AC-7: Ctrl+S 手动保存草稿
- [ ] AC-8: 页面加载时检测到草稿，显示恢复提示弹窗
- [ ] AC-9: 标题/正文/分类 blur 时显示内联验证错误
- [ ] AC-10: 点击提交时显示 loading 状态，禁用表单
- [ ] AC-11: 有未保存变更时离开页面显示确认弹窗
- [ ] AC-12: 发布成功后清除草稿并跳转到文章列表页
- [ ] AC-13: 编辑已有文章时，表单预填充现有数据
- [ ] AC-14: 所有组件在深色模式下正常显示
- [ ] AC-15: 页面在 1280x720 以上分辨率正常显示，无横向滚动条

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：完整工具栏<br>Given 打开文章编辑页<br>When 页面加载完成<br>Then 工具栏显示 12 个按钮 | `ArticleEditPage.test.tsx`: 渲染测试，断言工具栏按钮 | E2E: `editor/integration.spec.ts` - 页面完整渲染 | 运行 E2E | Completed |
| AC-2 | 场景：图片按钮触发上传<br>Given 文章编辑页<br>When 点击工具栏图片按钮<br>Then 打开图片上传组件 | `ArticleEditPage.test.tsx`: 模拟点击，断言上传组件打开 | E2E: `editor/integration.spec.ts` - 图片按钮 | 运行 E2E | Completed |
| AC-3 | 场景：编辑器拖拽上传<br>Given 文章编辑页<br>When 拖拽图片到编辑器<br>Then 触发批量上传流程 | `ArticleEditPage.test.tsx`: 模拟拖拽事件 | E2E: `editor/integration.spec.ts` - 拖拽上传 | 运行 E2E | Completed |
| AC-4 | 场景：封面图组件<br>Given 文章编辑页<br>When 查看表单<br>Then 封面图区域为拖拽上传组件 | `ArticleEditPage.test.tsx`: 断言 CoverImageUploader 存在 | E2E: `editor/integration.spec.ts` - 封面图组件 | 运行 E2E | Completed |
| AC-5 | 场景：智能标签<br>Given 文章编辑页<br>When 查看标签字段<br>Then 为 SmartTagInput 组件 | `ArticleEditPage.test.tsx`: 断言 SmartTagInput 存在 | E2E: `editor/integration.spec.ts` - 标签组件 | 运行 E2E | Completed |
| AC-6 | 场景：自动保存<br>Given 在编辑页输入内容<br>When 等待 30 秒<br>Then 显示"草稿已保存"Toast | `ArticleEditPage.test.tsx`: mock 定时器 | E2E: `editor/integration.spec.ts` - 自动保存（快进时间） | 运行 E2E | Completed |
| AC-7 | 场景：手动保存<br>Given 在编辑页<br>When 按 Ctrl+S<br>Then 显示"草稿已保存"Toast | `ArticleEditPage.test.tsx`: 模拟键盘事件 | E2E: `editor/integration.spec.ts` - 快捷键保存 | 运行 E2E | Completed |
| AC-8 | 场景：草稿恢复<br>Given localStorage 有草稿<br>When 打开新建文章页<br>Then 显示恢复提示弹窗 | `ArticleEditPage.test.tsx`: mock localStorage | E2E: `editor/integration.spec.ts` - 草稿恢复 | 运行 E2E | Completed |
| AC-9 | 场景：实时验证<br>Given 标题为空<br>When blur 标题<br>Then 显示内联错误 | `ArticleEditPage.test.tsx`: 模拟 blur 事件 | E2E: `editor/integration.spec.ts` - 验证错误 | 运行 E2E | Completed |
| AC-10 | 场景：提交 loading<br>Given 填写完整表单<br>When 点击发布<br>Then 按钮禁用且显示 spinner | `ArticleEditPage.test.tsx`: mock API，断言按钮状态 | E2E: `editor/integration.spec.ts` - 提交 loading | 运行 E2E | Completed |
| AC-11 | 场景：离开确认<br>Given 修改了表单<br>When 点击导航离开<br>Then 显示确认弹窗 | `ArticleEditPage.test.tsx`: 模拟路由事件 | E2E: `editor/integration.spec.ts` - 离开确认 | 运行 E2E | Completed |
| AC-12 | 场景：发布成功<br>Given 提交表单<br>When API 返回成功<br>Then 清除草稿并跳转列表页 | `ArticleEditPage.test.tsx`: mock 成功响应，断言导航 | E2E: `editor/integration.spec.ts` - 发布流程 | 运行 E2E | Completed |
| AC-13 | 场景：编辑预填充<br>Given 编辑 ID=5 的文章<br>When 页面加载<br>Then 表单预填充现有数据 | `ArticleEditPage.test.tsx`: mock 文章详情 API | E2E: `editor/integration.spec.ts` - 编辑预填充 | 运行 E2E | Completed |
| AC-14 | 场景：深色模式<br>Given 深色主题<br>When 查看编辑页<br>Then 所有组件适配深色主题 | 视觉回归测试 | E2E: `editor/integration.spec.ts` - 深色模式截图 | 人工检查 | Completed |
| AC-15 | 场景：响应式布局<br>Given 1280x720 视口<br>When 查看编辑页<br>Then 无横向滚动条，布局正常 | `ArticleEditPage.test.tsx`: 断言布局容器 | E2E: `editor/integration.spec.ts` - 视口测试 | 运行 E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 组件间状态冲突 | 中 | 数据不同步 | 统一使用 react-hook-form 管理表单状态；各组件通过 Controller 绑定 |
| 编辑器与上传组件事件冲突 | 中 | 拖拽同时触发编辑器焦点和上传 | 精确的事件委托和 stopPropagation |
| 性能问题（大量组件同时渲染） | 低 | 页面加载慢 | 组件懒加载；使用 React.memo 优化；骨架屏占位 |
| 集成后回归现有功能 | 中 | 原有编辑功能失效 | 完整的 E2E 回归测试覆盖新建/编辑/发布全流程 |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/app/(admin)/articles/__tests__/edit/page.test.tsx`
- **文件**: `frontend/src/app/(admin)/articles/__tests__/new/page.test.tsx`
- **覆盖率目标**: 分支覆盖率 ≥ 70%（集成页面以 E2E 为主）
- **测试重点**: 组件渲染、状态绑定、事件转发

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/integration.spec.ts`
- **场景**: 完整的新建文章流程、编辑文章流程、所有组件协同验证
- **数据准备**: 使用 API 创建测试文章，编辑后清理
- **截图对比**: 编辑页在明暗主题下的完整截图

### 9.3 手动验证

1. 新建文章：完整填写所有字段，验证各组件功能
2. 编辑文章：打开已有文章，验证数据预填充
3. 拖拽图片到编辑器，验证上传和插入
4. 粘贴图片，验证上传和插入
5. 30 秒自动保存，验证 Toast
6. Ctrl+S 手动保存
7. 刷新页面，验证草稿恢复弹窗
8. 修改内容后离开，验证确认弹窗
9. 发布文章，验证跳转和草稿清除
10. 切换深色模式，验证所有组件
11. 在 1280x720 和 1920x1080 分辨率下验证布局

## 10. Completion Notes

### 实际实现组件/文件路径
- 新建页面: `frontend/src/app/(admin)/articles/new/page.tsx`
- 编辑页面: `frontend/src/app/(admin)/articles/edit/[id]/page.tsx`
- 布局组件: `frontend/src/components/editor/ArticleEditorLayout.tsx`
- 状态管理: 使用 `react-hook-form` 的 `useForm` 统一管理，子组件通过 `Controller` 绑定
- 性能优化: 编辑器区域使用 `React.memo`，工具栏按钮使用 `useCallback`
- 与 Phase 1 协同: 确保文章列表页的"新建"和"编辑"跳转正确

### 关键决策
- **react-hook-form 统一管理表单状态**: 所有子组件通过 `Controller` 绑定，避免组件间状态冲突和数据不同步
- **精确的事件委托和 stopPropagation**: 编辑器拖拽上传时精确控制事件流，避免编辑器焦点和上传流程同时触发
- **组件懒加载 + React.memo**: 页面组件过多时使用懒加载，编辑器区域使用 `React.memo` 避免不必要的重渲染

### 遇到的问题及解决方案
- **组件间状态冲突**: 统一使用 react-hook-form 管理表单状态，各子组件通过 Controller 绑定，确保数据单向流动
- **编辑器与上传组件事件冲突**: 精确控制拖拽事件的事件委托和 `stopPropagation`，区分编辑器内拖拽和外部拖拽行为
- **集成后回归现有功能**: 完整的 E2E 回归测试覆盖新建/编辑/发布全流程，确保 Phase 1 功能不受影响
- **性能问题（大量组件同时渲染）**: 编辑器区域使用 `React.memo`，工具栏按钮使用 `useCallback`，必要时添加骨架屏占位

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- E2E 测试: `editor/integration.spec.ts` 全部通过
- 手动验证清单: 11 项全部完成

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03