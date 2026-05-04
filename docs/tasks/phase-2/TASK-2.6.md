# Task 2.6: 表单验证与体验优化

> **Task ID**: TASK-2.6
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: 无（与 TASK-2.4 和 TASK-2.3 并行）

## 1. Background

当前文章编辑页的表单验证仅在提交时触发，错误信息以全局 Toast 形式显示，用户难以定位具体字段。缺少实时反馈、提交 loading 状态、未保存离开确认等基础体验保障。Phase 2 要求全面升级表单验证和交互体验。

## 2. Goal

为文章编辑表单实现实时验证（blur 触发）、内联错误提示、提交 loading 状态、未保存离开确认弹窗，将表单体验从"提交后报错"升级为"即时引导"。

## 3. Scope

### In Scope

- 实时表单验证（`react-hook-form` + `zod` schema）
- Blur 时触发字段级验证
- 内联错误信息（字段下方红色提示文字）
- 提交按钮 loading 状态（禁用 + spinner）
- 未保存离开确认弹窗（路由离开 + 页面关闭）
- 字段级校验规则：标题必填、正文必填、分类必填
- 表单 dirty 状态追踪（判断是否有未保存变更）
- 提交成功后重置 dirty 状态
- 错误字段自动滚动到可视区域

### Out of Scope

- 后端表单验证（保持现有后端校验）
- 表单字段级联联动（如选择分类后动态加载标签）
- 分步表单/向导式表单
- 自动填充（autofill）优化
- 表单草稿自动保存（TASK-2.5 负责）

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 填写文章表单时获得即时反馈，避免提交后才发现错误 |

## 5. Behavior Contract

### 5.1 状态机

```
[初始状态] → 表单刚加载，所有字段未 touched
    ↓ 用户输入内容后 blur
[已验证] → 单个字段验证，显示错误或无错误
    ↓ 继续填写其他字段
[全部有效] → 所有必填字段通过验证
    ↓ 点击提交
[提交中] → 按钮禁用，显示 spinner，表单字段禁用
    ↓ API 返回成功
[提交成功] → 显示成功 Toast，重置 dirty 状态，跳转或刷新
    ↓ API 返回错误
[提交错误] → 显示后端错误（字段级或全局），恢复表单可编辑

[有未保存变更]
    ↓ 点击浏览器后退 / 关闭标签页
[离开确认] → 显示确认对话框"有未保存的更改，确定离开吗？"
    ↓ 用户确认离开
[放弃更改] → 离开页面
    ↓ 用户取消
[留在页面] → 回到表单编辑
```

### 5.2 校验规则

| 字段 | 规则 | 错误提示 | 触发时机 |
|------|------|----------|----------|
| 标题 | 必填，长度 1-100 | "标题不能为空" / "标题长度需在 1-100 字符之间" | blur |
| 正文 | 必填，长度 ≥ 10 | "正文不能为空" / "正文内容过短" | blur |
| 分类 | 必填（选择分类 ID） | "请选择分类" | blur |
| 标签 | 可选，最多 5 个 | "最多选择 5 个标签" | change |
| 封面图 | 可选，URL 格式 | "封面图 URL 格式不正确" | blur |

### 5.3 错误显示规范

- 位置：字段下方，距字段 4px
- 样式：文字颜色 `text-destructive`，字号 `text-sm`
- 动画：淡入（opacity 0→1，duration 150ms）
- 图标：左侧可选 lucide `AlertCircle` 图标
- 多行错误：多个错误换行显示

### 5.4 提交按钮状态

| 状态 | 样式 | 行为 |
|------|------|------|
| 默认 | primary 样式，文字"发布" | 可点击 |
| 表单无效 | 保持 primary，但点击时触发表单级验证，滚动到第一个错误 | 可点击（用于显示所有错误） |
| 提交中 | 禁用，显示 spinner，文字"发布中..." | 不可点击 |
| 提交成功 | 显示成功 Toast，按钮恢复默认 | 可点击 |

### 5.5 离开确认

- 触发条件：表单 dirty 为 true 且用户尝试离开页面
- 页面关闭：监听 `beforeunload`，返回确认消息
- 路由跳转：使用 Next.js `useRouter` 事件拦截，显示自定义确认弹窗
- 确认弹窗：标题"未保存的更改"，内容"您有未保存的更改，离开后将丢失。"，按钮"离开"（destructive）、"留在页面"（primary）

## 6. Acceptance Criteria

- [ ] AC-1: 标题字段 blur 时，若为空显示"标题不能为空"错误
- [ ] AC-2: 标题字段 blur 时，若长度 >100 显示长度错误
- [ ] AC-3: 正文字段 blur 时，若为空或 <10 字符显示对应错误
- [ ] AC-4: 分类字段 blur 时，若未选择显示"请选择分类"
- [ ] AC-5: 错误信息以内联形式显示在字段下方，红色文字
- [ ] AC-6: 修正错误后再次 blur，错误信息消失
- [ ] AC-7: 点击提交时，若表单无效，自动滚动到第一个错误字段
- [ ] AC-8: 提交按钮在提交中显示 loading spinner 和"发布中..."文字
- [ ] AC-9: 提交中禁用表单所有字段和按钮
- [ ] AC-10: 表单有变更（dirty=true）时，尝试离开页面显示浏览器确认对话框
- [ ] AC-11: 表单有变更时，点击路由跳转显示自定义确认弹窗
- [ ] AC-12: 确认弹窗包含"离开"和"留在页面"两个选项
- [ ] AC-13: 提交成功后，dirty 状态重置，离开不再提示
- [ ] AC-14: 后端返回字段级错误时，映射到对应字段显示
- [ ] AC-15: 后端返回全局错误时，显示在表单顶部 Toast

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：标题必填验证<br>Given 标题字段为空<br>When blur 标题输入框<br>Then 显示"标题不能为空" | `ArticleForm.test.tsx`: 模拟 blur，断言错误文本 | E2E: `editor/form.spec.ts` - 标题验证 | 运行 E2E | Completed |
| AC-2 | 场景：标题长度验证<br>Given 标题输入 101 个字符<br>When blur<br>Then 显示长度错误 | `ArticleForm.test.tsx`: 模拟超长输入，断言错误 | E2E: `editor/form.spec.ts` - 标题长度 | 运行 E2E | Completed |
| AC-3 | 场景：正文验证<br>Given 正文为空<br>When blur<br>Then 显示"正文不能为空" | `ArticleForm.test.tsx`: 断言正文验证 | E2E: `editor/form.spec.ts` - 正文验证 | 运行 E2E | Completed |
| AC-4 | 场景：分类验证<br>Given 未选择分类<br>When blur 分类选择器<br>Then 显示"请选择分类" | `ArticleForm.test.tsx`: 断言分类验证 | E2E: `editor/form.spec.ts` - 分类验证 | 运行 E2E | Completed |
| AC-5 | 场景：错误显示位置<br>Given 标题验证失败<br>When 显示错误<br>Then 错误在标题输入框下方，红色文字 | `ArticleForm.test.tsx`: 断言错误元素位置和样式 | 视觉回归测试 | 人工检查 | Completed |
| AC-6 | 场景：错误清除<br>Given 标题显示错误<br>When 输入有效内容并 blur<br>Then 错误信息消失 | `ArticleForm.test.tsx`: 模拟修正，断言错误消失 | E2E: `editor/form.spec.ts` - 错误清除 | 运行 E2E | Completed |
| AC-7 | 场景：提交滚动到错误<br>Given 多个字段无效<br>When 点击提交<br>Then 页面滚动到第一个错误字段 | `ArticleForm.test.tsx`: mock scrollIntoView，断言调用 | E2E: `editor/form.spec.ts` - 提交滚动 | 运行 E2E | Completed |
| AC-8 | 场景：提交 loading<br>Given 表单有效<br>When 点击提交<br>Then 按钮显示 spinner 和"发布中..." | `ArticleForm.test.tsx`: 模拟提交，断言按钮状态 | E2E: `editor/form.spec.ts` - loading 状态 | 运行 E2E | Completed |
| AC-9 | 场景：提交禁用<br>Given 提交中<br>When 尝试点击其他字段<br>Then 表单字段禁用 | `ArticleForm.test.tsx`: 断言字段 disabled 状态 | E2E: `editor/form.spec.ts` - 禁用状态 | 运行 E2E | Completed |
| AC-10 | 场景：页面关闭提示<br>Given 表单有变更<br>When 关闭浏览器标签<br>Then 显示浏览器确认对话框 | `useUnsavedChanges.test.ts`: 模拟 beforeunload | E2E: `editor/form.spec.ts` - beforeunload（stub） | 运行 E2E | Completed |
| AC-11 | 场景：路由离开提示<br>Given 表单有变更<br>When 点击导航链接<br>Then 显示自定义确认弹窗 | `useUnsavedChanges.test.ts`: 模拟路由事件 | E2E: `editor/form.spec.ts` - 路由离开 | 运行 E2E | Completed |
| AC-12 | 场景：确认弹窗选项<br>Given 确认弹窗显示<br>Then 包含"离开"和"留在页面"按钮 | `UnsavedChangesDialog.test.tsx`: 渲染测试 | E2E: `editor/form.spec.ts` - 弹窗内容 | 运行 E2E | Completed |
| AC-13 | 场景：成功后重置 dirty<br>Given 提交成功<br>Then dirty=false，离开不再提示 | `useUnsavedChanges.test.ts`: 模拟成功，断言 dirty 状态 | E2E: `editor/form.spec.ts` - dirty 重置 | 运行 E2E | Completed |
| AC-14 | 场景：后端字段错误<br>Given 后端返回 40010 且 fieldErrors 包含 title<br>When 提交失败<br>Then title 字段显示后端错误信息 | `ArticleForm.test.tsx`: mock 后端错误响应 | E2E: `editor/form.spec.ts` - 后端错误映射 | 运行 E2E | Completed |
| AC-15 | 场景：后端全局错误<br>Given 后端返回 50000<br>When 提交失败<br>Then 显示全局 Toast 错误 | `ArticleForm.test.tsx`: mock 服务器错误，断言 Toast | E2E: `editor/form.spec.ts` - 全局错误 | 运行 E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Zod schema 与后端校验不一致 | 中 | 前端通过但后端报错 | 保持 schema 与后端一致；后端错误映射到前端字段 |
| 大量字段同时验证导致性能问题 | 低 | 输入卡顿 | 仅 blur 触发验证；使用 debounce |
| 路由拦截与 Next.js App Router 不兼容 | 中 | 离开确认不生效 | 使用 `beforeunload` 兜底；测试 App Router 导航事件 |
| 第三方库（react-hook-form/zod）版本兼容性 | 低 | 类型错误或功能异常 | 使用当前项目已安装的版本，不升级 |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/components/editor/__tests__/ArticleForm.test.tsx`
- **文件**: `frontend/src/hooks/__tests__/useUnsavedChanges.test.ts`
- **文件**: `frontend/src/components/editor/__tests__/UnsavedChangesDialog.test.tsx`
- **覆盖率目标**: 分支覆盖率 ≥ 80%
- **测试重点**: 验证逻辑、错误显示、提交状态、离开拦截

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/form.spec.ts`
- **场景**: 字段验证、错误显示、提交 loading、离开确认、后端错误映射
- **Mock**: mock 后端 API 返回各种错误状态码

### 9.3 手动验证

1. 打开文章编辑页，直接 blur 标题，验证必填错误
2. 输入 101 字符标题，验证长度错误
3. 清空正文，验证正文错误
4. 不选分类，验证分类错误
5. 修正错误，验证错误消失
6. 点击提交（多个错误），验证滚动到第一个错误
7. 填写正确内容提交，验证 loading 状态
8. 修改内容后点击浏览器后退，验证确认对话框
9. 修改内容后点击导航菜单，验证自定义弹窗
10. mock 后端返回字段错误，验证映射显示

## 10. Completion Notes

### 实际实现组件/文件路径
- 表单验证 Schema: `frontend/src/lib/validations/article.ts`（Zod schema）
- 表单组件: 复用现有文章编辑表单，增强验证逻辑
- Hook: `frontend/src/hooks/useUnsavedChanges.ts`
- 弹窗组件: `frontend/src/components/editor/UnsavedChangesDialog.tsx`
- 依赖: `react-hook-form` 和 `zod`（已安装并配置）
- 后端错误格式: `{code: 40010, flag: false, message: "...", data: {fieldErrors: {title: "..."}}}`
- 与 TASK-2.5 协同: 自动保存的 dirty 状态与表单 dirty 状态同步

### 关键决策
- **react-hook-form + zod 组合**: 利用当前项目已安装的版本，不升级，避免版本兼容性问题
- **blur 触发字段级验证**: 减少输入过程中的验证干扰，仅在用户离开字段时提示错误
- **beforeunload 兜底 + 路由拦截双保险**: 页面关闭使用浏览器原生确认对话框，路由跳转使用自定义弹窗，确保不丢失未保存内容

### 遇到的问题及解决方案
- **Zod schema 与后端校验不一致**: 保持 schema 与后端一致，后端返回字段级错误时映射到对应前端字段，全局错误显示在表单顶部 Toast
- **路由拦截与 Next.js App Router 不兼容**: 使用 `beforeunload` 兜底处理页面关闭，针对 App Router 导航事件做特殊处理，测试各种导航场景
- **大量字段同时验证导致性能问题**: 仅 blur 触发验证，不使用实时输入验证，避免输入卡顿

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- 单元测试覆盖率: 分支覆盖率 ≥ 80%

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03