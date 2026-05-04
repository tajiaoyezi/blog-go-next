# Task 5.3: 表单页移动端适配

> **Task ID**: TASK-5.3
> **Phase**: PHASE-5
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-5.1

---

## 1. Background

管理后台的表单页（文章编辑、分类/标签创建、站点设置等）当前使用多列或固定宽度布局，在移动端输入框过小、按钮拥挤、需要横向滚动。表单是管理后台的核心操作场景，移动端表单可用是管理后台可用的基础。

## 2. Goal

改造所有表单页，在移动端使用单列布局、增大输入框触摸区域、按钮全宽显示，确保表单在手机上可正常使用。

## 3. Scope

### In Scope

- 文章编辑页 `/admin/articles/edit` 和 `/admin/articles/new`
- 分类创建/编辑页 `/admin/categories/new` 和 `/admin/categories/edit`
- 标签创建/编辑页 `/admin/tags/new` 和 `/admin/tags/edit`
- 相册创建/编辑页 `/admin/albums/new` 和 `/admin/albums/edit`
- 站点设置页 `/admin/settings`
- 表单布局：单列（移动端）
- 输入框最小高度 ≥ 44px（iOS 推荐触摸目标）
- 按钮全宽显示（移动端）
- 表单标签与输入框垂直排列（移动端）

### Out of Scope

- 复杂表单分步向导（后续优化）
- 表单自动保存
- 键盘类型优化（如数字键盘、邮箱键盘）

## 4. Users / Actors

- **博主/管理员**: 在手机或平板上创建/编辑内容

## 5. Behavior Contract

### 布局规则

| 元素 | 桌面端 (≥768px) | 移动端 (<768px) |
|------|----------------|----------------|
| 表单布局 | 多列（如标签 + 输入框同行） | 单列，标签在上，输入框在下 |
| 输入框宽度 | 固定或自适应 | 100% 宽度 |
| 输入框高度 | 默认 | min-height: 44px |
| 按钮 | 内联或右对齐 | 100% 宽度，垂直堆叠 |
| 间距 | md/lg | sm（紧凑但可触摸） |
| 编辑器 | 全宽 | 全宽，工具栏可横向滚动 |

### 文章编辑页特殊处理

```
桌面端:
┌──────────────────────────────┬───────────────┐
│ 标题 [                    ]  │  发布设置      │
│                              │  [发布]        │
│ 分类 [选择分类    ▼]        │  [草稿]        │
│ 标签 [选择标签    ▼]        │               │
│                              │  封面图        │
│ [编辑器]                     │  [上传]        │
│                              │               │
└──────────────────────────────┴───────────────┘

移动端:
┌─────────────────────────────┐
│ 标题                        │
│ [                        ]  │
│ 分类                        │
│ [选择分类            ▼]     │
│ 标签                        │
│ [选择标签            ▼]     │
│ [编辑器]                    │
│ 发布设置                    │
│ [发布]                      │
│ [草稿]                      │
│ 封面图                      │
│ [上传]                      │
└─────────────────────────────┘
```

### 按钮优先级

- 主要操作（保存、发布）：全宽，顶部
- 次要操作（取消、返回）：全宽，底部，outline 样式
- 危险操作（删除）：全宽，底部，destructive 样式

## 6. Acceptance Criteria

- [ ] 所有表单页在移动端为单列布局
- [ ] 输入框高度 ≥ 44px
- [ ] 按钮在移动端占满宽度
- [ ] 表单标签在输入框上方（移动端）
- [ ] 文章编辑器在移动端全宽显示
- [ ] 编辑器工具栏在移动端可横向滚动
- [ ] 下拉选择框（分类、标签）在移动端正常展开
- [ ] 表单提交按钮在移动端易于点击
- [ ] 表单验证错误提示在移动端清晰可见
- [ ] 所有表单页在移动端无需横向滚动（编辑器除外）
- [ ] 深色模式无视觉问题
- [ ] iOS Safari 输入框不触发页面缩放（font-size ≥ 16px）

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 单列布局 | SC-5.3.1: 管理员在手机上打开文章编辑页，表单为单列 | `test/forms/mobile-layout.test.tsx` | `e2e/admin-form-layout.spec.ts` | 手动 + E2E | Not Started |
| 输入框高度 | SC-5.3.2: 所有输入框触摸区域 ≥ 44px | `test/forms/input-height.test.tsx` | `e2e/admin-form-input.spec.ts` | DevTools | Not Started |
| 按钮全宽 | SC-5.3.3: 移动端提交按钮占满宽度 | `test/forms/button-width.test.tsx` | `e2e/admin-form-button.spec.ts` | 手动 + E2E | Not Started |
| 编辑器适配 | SC-5.3.4: 文章编辑器在手机上全宽，工具栏可滚动 | - | `e2e/admin-form-editor.spec.ts` | 手动 + E2E | Not Started |
| 下拉选择 | SC-5.3.5: 分类下拉框在手机上正常展开和选择 | `test/forms/select-mobile.test.tsx` | `e2e/admin-form-select.spec.ts` | 手动 + E2E | Not Started |
| 错误提示可见 | SC-5.3.6: 表单验证错误在手机上清晰可见 | `test/forms/error-mobile.test.tsx` | `e2e/admin-form-error.spec.ts` | 手动 + E2E | Not Started |
| iOS 不缩放 | SC-5.3.7: 在 iOS Safari 上聚焦输入框不触发页面缩放 | - | `e2e/admin-form-ios.spec.ts` | 真机 | Not Started |
| 所有表单覆盖 | SC-5.3.8: 所有表单页在移动端均可正常填写和提交 | - | `e2e/admin-form-all.spec.ts` | 手动 | Not Started |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| MDEditor 移动端不友好 | 中 | 编辑器无法使用 | 测试编辑器移动端表现，准备只读降级 |
| 复杂表单（文章编辑）过长 | 中 | 用户滚动疲劳 | 分区块展示，折叠次要设置 |
| iOS Safari 底部栏遮挡按钮 | 中 | 底部按钮不可点击 | 增加底部 padding（env(safe-area-inset-bottom)） |
| 下拉选择移动端体验差 | 中 | 选择困难 | 使用 shadcn Select 组件，已做移动端优化 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome DevTools 设备模拟（iPhone SE, iPhone 14, iPad）
- Manual: 真机 iOS Safari 测试（如可用）
- Manual: Android Chrome 测试（如可用）
- Accessibility: 触摸目标大小、焦点顺序

## 10. Completion Notes

- Changed source: `src/app/admin/articles/edit/page.tsx`, `src/app/admin/categories/*/page.tsx`, `src/app/admin/tags/*/page.tsx`, `src/app/admin/albums/*/page.tsx`, `src/app/admin/settings/page.tsx`, `src/components/form/*`
- Changed tests: `e2e/admin-form-*.spec.ts`, `test/forms/*.test.tsx`
- Verification result: 待填写
- Remaining risk: 待填写
