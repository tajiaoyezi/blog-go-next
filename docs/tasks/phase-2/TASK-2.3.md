# Task 2.3: 封面图上传组件

> **Task ID**: TASK-2.3
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: TASK-2.2（复用图片上传逻辑）

## 1. Background

文章编辑页需要为每篇文章设置封面图，当前仅为一个简单的文本输入框（输入图片 URL）。管理员需要手动上传图片到外部图床再复制 URL，操作繁琐。Phase 2 要求将封面图上传升级为可视化的拖拽上传组件，支持实时预览。

## 2. Goal

创建 `CoverImageUploader` 组件，替换现有的封面图 URL 输入框，提供拖拽上传区域、图片预览、删除重传功能，上传成功后自动填充文章表单中的封面图字段。

## 3. Scope

### In Scope

- `CoverImageUploader` 组件
- 拖拽上传区域（带虚线边框的放置区）
- 点击上传（点击区域打开文件选择）
- 图片预览（等比缩放，最大显示区域 400x225，即 16:9）
- 删除按钮（清除已上传的封面图）
- 上传进度条
- 文件校验（类型：jpg/png/gif/webp；大小：≤ 5MB）
- 与文章表单数据双向绑定（受控组件）

### Out of Scope

- 封面图裁剪/调整尺寸
- 从文章正文中选择封面图
- 封面图在文章列表的实时预览（Phase 3 处理）
- 多封面图支持（仅单张）
- AI 自动生成封面图

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 发布文章时上传封面图，提升文章在列表和社交分享中的展示效果 |

## 5. Behavior Contract

### 5.1 状态机

```
[空状态] → 显示拖拽区域和提示文字
    ↓ 拖拽/点击选择文件
[校验中] → 校验通过：进入上传中
         → 校验失败：显示错误，回到空状态
    ↓ 上传中
[上传中] → 显示进度条
    ↓ 上传成功
[预览状态] → 显示预览图 + 删除按钮
    ↓ 点击删除
[空状态] → 清除已选文件，调用 onChange(null)
```

### 5.2 组件接口

```typescript
interface CoverImageUploaderProps {
  value?: string;           // 当前封面图 URL（来自表单）
  onChange: (url: string | null) => void;  // 上传成功/删除时回调
  disabled?: boolean;       // 禁用状态
  aspectRatio?: number;     // 预览宽高比，默认 16/9
  maxSize?: number;         // 最大文件大小（MB），默认 5
}
```

### 5.3 视觉规范

- 空状态：虚线边框区域，中心显示上传图标 + "拖拽图片到此处或点击上传" 提示
- 拖拽悬停：边框颜色变为 primary，背景轻微变色
- 上传中：区域显示进度条（圆形或线性），覆盖在预览区域上
- 预览状态：图片等比填充，右下角悬浮删除按钮（红色圆形图标）
- 错误状态：边框变红，下方显示错误提示文字

## 6. Acceptance Criteria

- [ ] AC-1: 空状态显示拖拽区域，带虚线边框、上传图标和提示文字
- [ ] AC-2: 拖拽图片到区域时，边框高亮反馈
- [ ] AC-3: 点击区域打开系统文件选择对话框
- [ ] AC-4: 选择图片后显示上传进度条
- [ ] AC-5: 上传成功后显示图片预览，并触发 `onChange(url)`
- [ ] AC-6: 预览图片保持 16:9 比例，不拉伸变形
- [ ] AC-7: 点击删除按钮清除封面图，回到空状态，触发 `onChange(null)`
- [ ] AC-8: 传入 `value` 时（编辑已有文章），直接显示预览状态
- [ ] AC-9: 选择非图片文件时显示格式错误
- [ ] AC-10: 选择超过 5MB 的文件时显示大小错误
- [ ] AC-11: `disabled` 为 true 时，禁用拖拽和点击交互
- [ ] AC-12: 深色模式下各状态视觉正常

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：空状态渲染<br>Given 新建文章页<br>When 页面加载<br>Then 封面图区域显示拖拽提示 | `CoverImageUploader.test.tsx`: 渲染测试，断言提示文字存在 | E2E: `editor/cover.spec.ts` - 空状态截图 | 运行 E2E | Completed |
| AC-2 | 场景：拖拽悬停反馈<br>Given 封面图区域<br>When 拖拽图片进入区域<br>Then 边框颜色变为 primary | `CoverImageUploader.test.tsx`: 模拟 dragenter，断言样式变化 | E2E: `editor/cover.spec.ts` - 拖拽悬停视觉 | 运行 E2E | Completed |
| AC-3 | 场景：点击打开文件选择<br>Given 封面图区域<br>When 点击区域<br>Then 触发 `<input type="file">` 点击 | `CoverImageUploader.test.tsx`: 模拟点击，断言 input 被触发 | E2E: `editor/cover.spec.ts` - 点击上传 | 运行 E2E | Completed |
| AC-4 | 场景：上传进度显示<br>Given 选择图片后<br>When 上传进行至 50%<br>Then 进度条显示 50% | `CoverImageUploader.test.tsx`: mock 上传进度，断言进度条值 | E2E: `editor/cover.spec.ts` - 进度验证 | 运行 E2E | Completed |
| AC-5 | 场景：上传成功回调<br>Given 上传完成<br>When 后端返回 url<br>Then 显示预览图<br>And onChange 被调用且参数为 url | `CoverImageUploader.test.tsx`: mock 成功响应，断言 onChange 和预览 | E2E: `editor/cover.spec.ts` - 成功流程 | 运行 E2E | Completed |
| AC-6 | 场景：预览比例正确<br>Given 上传一张竖图<br>When 显示预览<br>Then 图片在 16:9 容器内等比缩放，不拉伸 | `CoverImageUploader.test.tsx`: 断言图片容器 CSS `object-fit: cover` | 视觉回归测试 | 人工检查 | Completed |
| AC-7 | 场景：删除封面图<br>Given 已有预览图<br>When 点击删除按钮<br>Then 回到空状态<br>And onChange(null) 被调用 | `CoverImageUploader.test.tsx`: 模拟删除，断言状态和回调 | E2E: `editor/cover.spec.ts` - 删除操作 | 运行 E2E | Completed |
| AC-8 | 场景：编辑时显示已有封面<br>Given 编辑已有文章且 value 有值<br>When 页面加载<br>Then 直接显示预览状态 | `CoverImageUploader.test.tsx`: 传入 value，断言预览图 src | E2E: `editor/cover.spec.ts` - 编辑模式 | 运行 E2E | Completed |
| AC-9 | 场景：格式错误<br>Given 选择 PDF 文件<br>When 文件选择完成<br>Then 显示"仅支持图片格式"错误 | `CoverImageUploader.test.tsx`: 传入 PDF，断言错误提示 | E2E: `editor/cover.spec.ts` - 格式错误 | 运行 E2E | Completed |
| AC-10 | 场景：大小错误<br>Given 选择 8MB 图片<br>When 文件选择完成<br>Then 显示"图片不能超过 5MB"错误 | `CoverImageUploader.test.tsx`: 传入大文件，断言错误提示 | E2E: `editor/cover.spec.ts` - 大小错误 | 运行 E2E | Completed |
| AC-11 | 场景：禁用状态<br>Given disabled=true<br>When 点击或拖拽<br>Then 不触发任何上传操作 | `CoverImageUploader.test.tsx`: 传入 disabled，模拟交互，断言无反应 | E2E: `editor/cover.spec.ts` - 禁用验证 | 运行 E2E | Completed |
| AC-12 | 场景：深色模式<br>Given 深色主题<br>When 查看封面图组件<br>Then 边框、背景、文字颜色适配 | 视觉回归测试 | E2E: `editor/cover.spec.ts` - 深色模式截图 | 人工检查 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 图片预览跨域问题 | 低 | 已有图片无法显示 | 使用后端代理或检查 CORS 头 |
| 上传后表单未同步 | 低 | 提交时封面图为空 | 确保 onChange 在表单中正确绑定 |
| 竖图在 16:9 容器中显示不佳 | 低 | 封面图被裁剪 | 明确需求为 cover 填充，必要时后续支持裁剪 |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/components/editor/__tests__/CoverImageUploader.test.tsx`
- **覆盖率目标**: 分支覆盖率 ≥ 80%
- **测试重点**: 状态转换、文件校验、回调触发、禁用状态

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/cover.spec.ts`
- **场景**: 拖拽上传、点击上传、预览显示、删除、错误处理、编辑模式
- **Mock**: mock 上传 API 响应

### 9.3 手动验证

1. 新建文章页，查看封面图空状态
2. 拖拽图片到封面区域，验证高亮反馈和上传
3. 点击封面区域，选择图片上传
4. 上传完成后查看预览，确认比例正确
5. 点击删除，验证回到空状态
6. 编辑已有文章，验证已有封面图显示
7. 切换深色模式，验证视觉效果

## 10. Completion Notes

### 实际实现组件/文件路径
- 组件: `frontend/src/components/editor/CoverImageUploader.tsx`
- 复用 Hook: `frontend/src/hooks/useImageUpload.ts`（从 TASK-2.2 复用，限制单文件上传）
- 样式: 使用 Tailwind CSS，遵循 shadcn/ui 设计规范
- 表单集成: 在文章编辑页的表单中替换现有封面图输入框
- 提示: 空状态文字使用 `i18n` 键 `editor.cover.placeholder`

### 关键决策
- **复用 TASK-2.2 上传 Hook**: 复用核心上传逻辑，通过参数限制单文件上传，避免代码重复
- **受控组件设计**: `value` + `onChange` 接口，与表单数据双向绑定，编辑已有文章时直接显示预览
- **预览比例固定 16:9**: 使用 `object-fit: cover` 保证图片等比缩放填充，明确告知用户竖图会被裁剪

### 遇到的问题及解决方案
- **图片预览跨域问题**: 已有图片 URL 可能跨域，使用后端代理或检查 CORS 头，确保预览正常显示
- **上传后表单未同步**: 确保 `onChange` 在表单中正确绑定，上传成功后立即更新表单状态
- **竖图在 16:9 容器中显示不佳**: 使用 `object-fit: cover` 配合 `object-position: center`，在保持比例的同时居中裁剪

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- 单元测试覆盖率: 分支覆盖率 ≥ 80%

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03