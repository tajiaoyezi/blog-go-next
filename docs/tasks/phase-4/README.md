# Phase Spec: Phase 4 - 相册/媒体管理升级

> **Phase ID**: PHASE-4
> **Status**: Completed
> **Priority**: P2
> **预估工期**: 4 天
> **Master Spec**: `docs/tasks/README.md`

---

## 1. 阶段目标

将管理后台相册页面从基础表格升级为 Halo 级媒体管理中心，支持网格/列表双视图、瀑布流展示、Lightbox 大图预览、拖拽上传与批量操作。

## 2. 业务价值

- 媒体管理效率提升 2-3 倍
- 视觉型内容（图片）以可视化方式呈现，更符合直觉
- 减少图片管理操作步骤（上传、浏览、删除）

## 3. 涉及模块

### 页面

- `/admin/albums` - 相册列表页（网格/列表视图）
- `/admin/albums/:id` - 相册详情页（瀑布流图片展示）

### 新增组件

- `AlbumGrid` / `AlbumCard` - 相册网格/卡片
- `MasonryGallery` - 瀑布流图片画廊
- `Lightbox` - 大图预览（或集成 `yet-another-react-lightbox`）
- `UploadZone` - 拖拽上传区域
- `UploadProgress` - 上传进度条

## 4. 任务清单

| Task ID | 任务名称 | 预估 | 依赖 | 状态 |
|---------|---------|------|------|------|
| TASK-4.1 | 相册列表页视觉升级 | 1 天 | TASK-1.2 | Not Started |
| TASK-4.2 | 瀑布流图片展示 | 1 天 | TASK-4.1 | Not Started |
| TASK-4.3 | Lightbox 大图预览 | 1 天 | TASK-4.2 | Not Started |
| TASK-4.4 | 拖拽上传与批量操作 | 1 天 | TASK-4.2 | Not Started |

## 5. 依赖关系

```
TASK-4.1 (相册列表页视觉升级)
    ↓
TASK-4.2 (瀑布流图片展示)
    ↓
TASK-4.3 (Lightbox 大图预览)
TASK-4.4 (拖拽上传与批量操作)
```

TASK-4.3 和 TASK-4.4 可并行开发（均依赖 TASK-4.2）。

## 6. 阶段级验收标准

- [ ] 相册列表页支持网格/列表双视图切换
- [ ] 网格视图展示封面图、相册名、图片数量
- [ ] 相册详情页以瀑布流展示图片
- [ ] 瀑布流支持响应式列数（3/2/1）
- [ ] 图片懒加载正常工作
- [ ] Lightbox 支持放大、缩放、切换、键盘导航
- [ ] Lightbox 在 React 19 下无兼容性问题（或降级方案生效）
- [ ] 支持拖拽上传多张图片
- [ ] 上传显示进度条
- [ ] 支持批量选择删除图片
- [ ] TypeScript 编译无错误
- [ ] ESLint 无错误
- [ ] Chrome/Firefox/Safari 正常显示
- [ ] 移动端网格 1 列、瀑布流 1 列可用
- [ ] 深色模式无视觉问题

## 7. 阶段级风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| yet-another-react-lightbox 不兼容 React 19 | 高 | Phase 4 核心功能失效 | 安装后立即验证，准备自研降级方案 |
| 后端 API 不支持批量删除图片 | 高 | 批量删除功能受限 | 先确认 API，如不支持则前端循环调用 |
| 大量图片性能问题 | 中 | 页面卡顿 | 懒加载 + 限制同时加载数量 |
| 移动端拖拽体验差 | 中 | 移动端上传不便 | 移动端以点击上传为主 |

## 8. Definition of Done

Phase 4 完成时必须满足：

- [ ] 所有 Task 状态为 Done 或 Waived
- [ ] 追踪表 Verification 列全部通过
- [ ] BDD 场景已新增/更新
- [ ] E2E 测试已新增或记录豁免
- [ ] TypeScript 编译无错误 (`npx tsc --noEmit`)
- [ ] ESLint 无错误 (`npm run lint`)
- [ ] 所有页面在 Chrome/Firefox/Safari 正常显示
- [ ] 深色模式切换无视觉问题
- [ ] 移动端基本可用
- [ ] 无主 TODO、临时 mock、placeholder
- [ ] 剩余风险已记录
- [ ] Lightbox React 19 兼容性已验证并记录（ADR-004）

## 9. Task Spec 索引

| Task ID | 文件 |
|---------|------|
| TASK-4.1 | `docs/tasks/phase-4/TASK-4.1.md` |
| TASK-4.2 | `docs/tasks/phase-4/TASK-4.2.md` |
| TASK-4.3 | `docs/tasks/phase-4/TASK-4.3.md` |
| TASK-4.4 | `docs/tasks/phase-4/TASK-4.4.md` |

## 10. BDD Feature 文件

`docs/tasks/acceptance/phase-4.feature`

## 11. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本 |
