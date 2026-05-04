# Task 4.4: 拖拽上传与批量操作

> **Task ID**: TASK-4.4
> **Phase**: PHASE-4
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-4.2

---

## 1. Background

当前相册图片上传需要通过表单选择文件，操作繁琐。管理员经常需要一次上传多张图片，拖拽上传和批量操作是提升效率的关键功能。使用原生 HTML5 Drag and Drop API 实现拖拽上传，复用 TASK-2.2 的文件处理逻辑。

## 2. Goal

实现拖拽上传区域、批量选择/删除图片、上传进度显示，提升相册图片管理效率。

## 3. Scope

### In Scope

- 拖拽上传区域（相册页顶部或独立弹窗）
- 点击选择文件上传
- 上传进度条（单文件 + 总体）
- 批量选择模式（复选框）
- 批量删除（二次确认）
- 上传完成反馈（toast 通知）
- 上传失败重试

### Out of Scope

- 相册创建/编辑表单（已有功能）
- 图片裁剪/压缩（上传前处理）
- 批量移动到其他相册
- 批量修改图片信息（名称、描述）

## 4. Users / Actors

- **博主/管理员**: 上传多张图片到相册，批量清理不需要的图片

## 5. Behavior Contract

### API 说明

- **上传路径**: `POST /api/v1/admin/articles/images`（复用 TASK-2.2 的上传接口）
- **请求格式**: `multipart/form-data`，字段名 `file`
- **返回格式**: `{code, flag, message, data: "/uploads/2026/05/xxx.jpg"}`（data 为图片 URL 字符串）
- **批量策略**: 后端仅支持单文件上传，前端使用 Promise 队列串行/并发调用（最多 3 个并发）
- **删除路径**: `DELETE /api/v1/admin/photos`（接受 `[]int` JSON body，批量删除）

### 拖拽上传

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📤 拖拽图片到这里上传                    │
│                                                     │
│         或点击选择文件（支持多选）                    │
│                                                     │
│         支持格式: JPG, PNG, GIF, WebP               │
│         单文件最大: 10MB                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 拖拽进入时区域高亮（border color change + background change）
- 拖拽离开时恢复
- 放置后立即开始上传
- 支持多文件同时拖拽

### 上传进度

- 每个文件显示独立进度条
- 顶部显示总体进度（"上传中 3/5..."）
- 上传中文件显示骨架/旋转图标
- 上传成功显示绿色勾选
- 上传失败显示红色错误图标 + 重试按钮

### 批量操作

- 进入批量选择模式：Toolbar 显示 "选择" 按钮
- 选择后 Toolbar 变为批量操作栏（显示选中数量 + 删除按钮）
- 删除前弹出确认对话框（"确定删除选中的 5 张图片？此操作不可撤销。"）
- 删除成功后刷新列表 + toast 通知

### 文件校验

- 格式白名单：`image/jpeg`, `image/png`, `image/gif`, `image/webp`
- 大小限制：单文件 ≤ 10MB
- 非法文件提示："XXX.jpg 格式不支持" / "YYY.png 超过 10MB"

## 6. Acceptance Criteria

- [ ] 拖拽文件到上传区域，触发上传
- [ ] 点击上传区域打开文件选择器
- [ ] 支持多文件同时上传
- [ ] 每个文件显示独立进度条
- [ ] 显示总体上传进度
- [ ] 上传成功显示绿色勾选，失败显示红色错误 + 重试
- [ ] 非法格式/大小文件给出明确错误提示
- [ ] 批量选择模式下图片显示复选框
- [ ] 批量删除有二次确认
- [ ] 删除成功后 toast 通知 + 列表刷新
- [ ] 上传/删除过程中禁用相关操作防止重复提交
- [ ] 深色模式无视觉问题
- [ ] 移动端支持点击上传（拖拽非必需）

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 拖拽上传触发 | SC-4.4.1: 管理员拖拽 3 张图片到上传区，开始上传 | `test/upload/drop.test.tsx` | `e2e/admin-upload-drop.spec.ts` | 手动 + E2E | Completed |
| 点击选择文件 | SC-4.4.2: 管理员点击上传区，打开文件选择器，选择文件后上传 | `test/upload/click.test.tsx` | `e2e/admin-upload-click.spec.ts` | 手动 + E2E | Completed |
| 上传进度显示 | SC-4.4.3: 上传过程中显示进度条，完成后显示勾选 | `test/upload/progress.test.tsx` | `e2e/admin-upload-progress.spec.ts` | 手动 + E2E | Completed |
| 非法文件提示 | SC-4.4.4: 拖拽一个 .exe 文件，显示格式不支持错误 | `test/upload/validation.test.tsx` | `e2e/admin-upload-validation.spec.ts` | 手动 + E2E | Completed |
| 批量选择 | SC-4.4.5: 进入批量模式，勾选 3 张图片，Toolbar 显示 "已选 3 项" | `test/upload/batch-select.test.tsx` | `e2e/admin-batch-select.spec.ts` | 手动 + E2E | Completed |
| 批量删除确认 | SC-4.4.6: 点击批量删除，弹出确认框，确认后删除成功 | `test/upload/batch-delete.test.tsx` | `e2e/admin-batch-delete.spec.ts` | 手动 + E2E | Completed |
| 防重复提交 | SC-4.4.7: 上传过程中再次拖拽文件，忽略或提示等待 | `test/upload/debounce.test.tsx` | `e2e/admin-upload-debounce.spec.ts` | 手动 + E2E | Completed |
| 移动端点击上传 | SC-4.4.8: 在手机上点击上传区，正常选择并上传图片 | - | `e2e/admin-upload-mobile.spec.ts` | 真机/DevTools | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 大文件上传超时 | 中 | 上传失败 | 分片上传（后续优化）或增大超时 |
| 同时上传过多文件 | 中 | 浏览器内存/网络拥堵 | 限制并发数（最多 3 个并行） |
| 后端 API 不支持批量删除 | 高 | 只能逐个删除 | 先确认 API，如不支持则前端循环调用 |
| 移动端拖拽不支持 | 高 | 移动端只能点击 | 移动端以点击上传为主，非缺陷 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: 拖拽上传测试（不同文件数量/大小）
- Manual: Chrome/Firefox/Safari 跨浏览器测试
- Manual: 移动端点击上传测试
- API: 确认后端批量删除接口格式

## 10. Completion Notes

- Changed source: `src/components/upload-zone/*`, `src/components/upload-progress/*`, `src/hooks/use-upload.ts`, `src/app/admin/albums/[id]/page.tsx`
- Changed tests: `e2e/admin-upload-*.spec.ts`, `test/upload/*.test.tsx`
- Verification result: 待填写
- Remaining risk: 待填写
