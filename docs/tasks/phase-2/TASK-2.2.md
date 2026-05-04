# Task 2.2: 图片上传组件

> **Task ID**: TASK-2.2
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: TASK-2.1（工具栏需要图片按钮触发上传）

## 1. Background

当前文章编辑页缺少图片上传功能，管理员需要手动将图片上传到图床或其他位置，再手动复制 Markdown 图片语法插入文章。Master Spec 要求在 Phase 2 实现完整的图片上传体验，支持拖拽、粘贴、点击三种上传方式。

现有后端已提供图片上传 API：

- **路径**: `POST /api/v1/admin/articles/images`
- **请求**: `multipart/form-data`，字段名 `file`（单文件）
- **返回**: `{code, flag, message, data: "/uploads/2026/05/xxx.jpg"}`（data 为图片 URL 字符串）
- **限制**: 后端仅支持**单文件上传**，批量上传需前端串行/并发调用（最多 3 个并发）

前端基于现有 `api.ts` 的 `upload(path, file)` 方法封装批量上传逻辑。

## 2. Goal

创建 `ImageUploader` 组件，集成到 Markdown 编辑器中，支持拖拽、粘贴、点击上传多张图片，显示上传进度，成功后自动插入 Markdown 图片语法到编辑器光标位置。

## 3. Scope

### In Scope

- `ImageUploader` 组件（基于原生 HTML5 Drag and Drop API + `<input type="file">`）
- 三种上传触发方式：拖拽到编辑器区域、粘贴图片、点击工具栏图片按钮
- 批量上传（单次最多 10 张）
- 上传进度条显示（单文件 + 总进度）
- 上传成功后自动插入 Markdown 图片语法：`![alt](url)`
- 上传失败时显示错误信息，支持重试
- 图片文件类型白名单（jpg, jpeg, png, gif, webp）
- 单文件大小限制（5MB）
- 上传前图片预览（缩略图列表）

### Out of Scope

- 图片压缩/裁剪（Phase 4 处理）
- 图床对接（阿里云 OSS、腾讯云 COS 等）
- 图片水印
- 图片 EXIF 信息处理
- 从 URL 插入网络图片（通过工具栏链接按钮实现）

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 撰写文章时插入本地图片，快速完成图文排版 |

## 5. Behavior Contract

### 5.1 状态机

```
[空闲状态]
    ↓ 拖拽/粘贴/点击选择文件
[文件选择] → 校验文件类型和大小 → 失败：显示错误
    ↓ 校验通过
[预览状态] → 显示缩略图列表，可删除单张
    ↓ 点击上传
[上传中] → 显示进度条
    ↓ 上传成功
[完成] → 自动插入 Markdown，组件回到空闲状态
    ↓ 上传失败
[错误] → 显示错误，支持重试或取消
```

### 5.2 文件校验规则

| 校验项 | 规则 | 错误提示 |
|--------|------|----------|
| 文件类型 | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | "仅支持 JPG、PNG、GIF、WEBP 格式" |
| 单文件大小 | ≤ 5MB | "单张图片不能超过 5MB" |
| 单次数量 | ≤ 10 张 | "一次最多上传 10 张图片" |
| 重复文件 | 同次选择中文件名+大小相同 | "图片已选择，请勿重复添加" |

### 5.3 插入位置规则

- 编辑器有焦点：插入到光标位置
- 编辑器无焦点：插入到文档末尾
- 多图片上传：每张图片占一行，按上传完成顺序插入

### 5.4 粘贴上传行为

- 监听编辑器 `onPaste` 事件
- 若剪贴板中包含图片文件（`e.clipboardData.files`），拦截默认行为，触发上传流程
- 若剪贴板中包含文本，不拦截，保持默认粘贴行为

## 6. Acceptance Criteria

- [ ] AC-1: 拖拽图片到编辑器区域，触发上传流程，显示预览和进度
- [ ] AC-2: 点击工具栏图片按钮，打开文件选择对话框，支持多选
- [ ] AC-3: 在编辑器中粘贴图片（从截图工具或文件管理器复制），触发上传
- [ ] AC-4: 单次选择/拖拽/粘贴超过 10 张图片时，提示数量超限并拒绝多余文件
- [ ] AC-5: 选择非图片文件时，提示格式不支持
- [ ] AC-6: 选择超过 5MB 的图片时，提示大小超限
- [ ] AC-7: 预览列表显示缩略图、文件名、大小，支持删除单张
- [ ] AC-8: 上传过程中显示单文件进度条和总体进度
- [ ] AC-9: 上传成功后，Markdown 图片语法自动插入到编辑器光标位置
- [ ] AC-10: 上传失败时显示具体错误信息，提供重试按钮
- [ ] AC-11: 上传完成后组件自动重置为空闲状态，准备下一次上传
- [ ] AC-12: 上传过程中关闭页面或离开编辑器时，提示有未完成的操作

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：拖拽上传图片<br>Given 管理员在文章编辑页<br>When 将 3 张图片拖拽到编辑器区域<br>Then 显示预览列表和上传按钮 | `ImageUploader.test.tsx`: 模拟拖拽事件，断言文件列表更新 | E2E: `editor/upload.spec.ts` - 拖拽上传流程 | 运行 E2E | Completed |
| AC-2 | 场景：点击按钮上传<br>Given 管理员在文章编辑页<br>When 点击工具栏图片按钮<br>Then 打开文件选择对话框<br>When 选择 2 张图片<br>Then 预览列表显示 2 张缩略图 | `ImageUploader.test.tsx`: 模拟文件选择，断言预览渲染 | E2E: `editor/upload.spec.ts` - 点击上传流程 | 运行 E2E | Completed |
| AC-3 | 场景：粘贴上传<br>Given 管理员在编辑器中<br>When 粘贴剪贴板中的图片<br>Then 拦截默认行为，触发上传预览 | `ImageUploader.test.tsx`: 模拟 paste 事件，断言文件处理 | E2E: `editor/upload.spec.ts` - 粘贴上传（使用 stub） | 运行 E2E | Completed |
| AC-4 | 场景：批量数量限制<br>Given 管理员选择文件<br>When 一次选择 12 张图片<br>Then 提示"一次最多上传 10 张图片"<br>And 只接受前 10 张 | `ImageUploader.test.tsx`: 传入 12 个文件，断言错误提示和文件列表长度为 10 | E2E: `editor/upload.spec.ts` - 数量限制验证 | 运行 E2E | Completed |
| AC-5 | 场景：格式校验<br>Given 管理员选择文件<br>When 选择 1 个 PDF 文件<br>Then 提示"仅支持 JPG、PNG、GIF、WEBP 格式" | `ImageUploader.test.tsx`: 传入 PDF 文件，断言错误提示 | E2E: `editor/upload.spec.ts` - 格式错误验证 | 运行 E2E | Completed |
| AC-6 | 场景：大小限制<br>Given 管理员选择文件<br>When 选择 1 张 8MB 的图片<br>Then 提示"单张图片不能超过 5MB" | `ImageUploader.test.tsx`: 传入大文件，断言错误提示 | E2E: `editor/upload.spec.ts` - 大小限制验证 | 运行 E2E | Completed |
| AC-7 | 场景：预览列表操作<br>Given 预览列表中有 3 张图片<br>When 点击第 2 张的删除按钮<br>Then 列表中只剩 2 张 | `ImageUploader.test.tsx`: 渲染预览列表，模拟删除，断言列表更新 | E2E: `editor/upload.spec.ts` - 预览删除操作 | 运行 E2E | Completed |
| AC-8 | 场景：上传进度显示<br>Given 开始上传 3 张图片<br>When 第 1 张上传 50%<br>Then 单文件进度条显示 50%<br>And 总进度显示约 16% | `ImageUploader.test.tsx`: 模拟上传进度，断言进度条值 | E2E: `editor/upload.spec.ts` - 进度条验证（mock 慢速上传） | 运行 E2E | Completed |
| AC-9 | 场景：自动插入 Markdown<br>Given 上传 2 张图片成功<br>When 第 1 张完成<br>Then 编辑器插入 `![图片1](url1)`<br>When 第 2 张完成<br>Then 编辑器追加 `![图片2](url2)` | `useImageUpload.test.ts`: 模拟上传成功回调，断言编辑器值更新 | E2E: `editor/upload.spec.ts` - 插入内容验证 | 运行 E2E | Completed |
| AC-10 | 场景：上传失败重试<br>Given 上传过程中网络错误<br>When 第 2 张图片上传失败<br>Then 显示"上传失败：网络错误"<br>And 提供重试按钮<br>When 点击重试<br>Then 重新上传该图片 | `ImageUploader.test.tsx`: 模拟上传失败，断言错误显示和重试逻辑 | E2E: `editor/upload.spec.ts` - 失败重试流程 | 运行 E2E | Completed |
| AC-11 | 场景：完成后重置<br>Given 所有图片上传完成<br>When 最后一张插入编辑器<br>Then 上传组件回到空闲状态 | `ImageUploader.test.tsx`: 模拟全部完成，断言状态重置 | E2E: `editor/upload.spec.ts` - 状态重置验证 | 运行 E2E | Completed |
| AC-12 | 场景：上传中离开提示<br>Given 有图片正在上传<br>When 用户尝试关闭页面<br>Then 浏览器弹出确认对话框"有图片正在上传，确定离开吗？" | `useBeforeUnload.test.ts`: 模拟上传中状态，断言 beforeunload 事件注册 | E2E: `editor/upload.spec.ts` - 离开提示验证 | 运行 E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 浏览器粘贴 API 兼容性差异 | 中 | 部分浏览器无法粘贴上传 | 测试 Chrome/Firefox/Safari；降级提示手动上传 |
| 大文件上传超时 | 中 | 上传中断 | 分片上传（后续优化）；当前增加超时提示 |
| 后端上传 API 返回格式变动 | 低 | 解析失败 | 保持适配层统一解析，不直接依赖字段结构 |
| 同时上传多张导致服务器限流 | 低 | 429 错误 | 前端串行上传或限制并发数（最多 3 个并发） |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/components/editor/__tests__/ImageUploader.test.tsx`
- **文件**: `frontend/src/hooks/__tests__/useImageUpload.test.ts`
- **文件**: `frontend/src/hooks/__tests__/useBeforeUnload.test.ts`
- **覆盖率目标**: 分支覆盖率 ≥ 80%
- **测试重点**: 文件校验逻辑、上传状态机、进度计算、Markdown 插入位置

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/upload.spec.ts`
- **场景**: 拖拽上传、点击上传、粘贴上传、校验规则、进度显示、错误处理、自动插入
- **Mock**: 使用 Playwright 的 `route.fulfill()` mock 上传 API，控制成功/失败/进度

### 9.3 手动验证

1. 打开文章编辑页，拖拽本地图片到编辑器，验证上传流程
2. 复制图片到剪贴板，在编辑器中粘贴，验证上传
3. 选择超过 10 张图片，验证数量限制提示
4. 选择 PDF 文件，验证格式错误提示
5. 选择 8MB 图片，验证大小限制提示
6. 上传过程中关闭页面，验证确认对话框

## 10. Completion Notes

### 实际实现组件/文件路径
- 组件: `frontend/src/components/editor/ImageUploader.tsx`
- Hook: `frontend/src/hooks/useImageUpload.ts`
- 上传 API 封装: 复用现有 `api.ts`，新增 `uploadImages(files: File[])` 方法
- 粘贴事件监听: 在编辑器组件中集成，通过 `onPaste` 捕获

### 关键决策
- **使用原生 HTML5 Drag and Drop API 替代 react-dropzone**: 减少外部依赖，利用浏览器原生能力实现拖拽上传，代码更轻量可控
- **手动 Promise 队列控制并发**: 限制最多 3 个并发上传，避免服务器限流（429 错误），同时保证批量上传效率
- **粘贴事件精细化处理**: 仅拦截包含图片文件的粘贴事件（`e.clipboardData.files`），文本粘贴保持默认行为

### 遇到的问题及解决方案
- **浏览器粘贴 API 兼容性差异**: Chrome/Firefox/Safari 对 `clipboardData.files` 的支持略有不同，通过 feature detection 和降级提示手动上传解决
- **大文件上传超时**: 单文件 5MB 限制在前端校验，避免大文件上传中断；后续可优化为分片上传
- **同时上传多张导致服务器限流**: 通过 Promise 队列严格限制 3 个并发，超出任务排队等待

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- 单元测试覆盖率: 分支覆盖率 ≥ 80%

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03