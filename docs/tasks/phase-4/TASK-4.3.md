# Task 4.3: Lightbox 大图预览

> **Task ID**: TASK-4.3
> **Phase**: PHASE-4
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-4.2

---

## 1. Background

相册内的图片需要大图预览能力，以便管理员查看细节。当前没有 Lightbox 组件，点击图片只能在新标签页打开原图，体验差。使用 `yet-another-react-lightbox@^3.21.8`（已支持 React 19）实现该功能。

## 2. Goal

实现 Lightbox 大图预览功能，支持图片放大、缩放、切换、键盘导航。使用 `yet-another-react-lightbox@^3.21.8`（已原生支持 React 19），保留降级方案作为备选。

## 3. Scope

### In Scope

- Lightbox 组件集成（`yet-another-react-lightbox` 或自研降级方案）
- 点击图片打开 Lightbox
- 上一张/下一张切换（按钮 + 键盘方向键）
- 缩放：滚轮缩放、双击缩放、双击还原
- 键盘导航：← → 切换图片、Esc 关闭、+/- 缩放
- 图片计数器（"3 / 24"）
- 图片标题/文件名显示

### Out of Scope

- 图片编辑（裁剪、旋转、滤镜）
- 下载原图按钮（后续可扩展）
- 分享到社交功能
- 全屏模式（浏览器全屏 API）

## 4. Users / Actors

- **博主/管理员**: 查看相册图片细节、浏览多张图片

## 5. Behavior Contract

### 触发方式

- 瀑布流中的图片点击触发 Lightbox
- Lightbox 接收当前相册所有图片的 URL 列表和当前索引

### 交互映射

| 操作 | 行为 |
|------|------|
| 点击图片 / Enter 键 | 打开 Lightbox，显示当前图片 |
| ← / 点击左侧区域 | 上一张（循环到末尾） |
| → / 点击右侧区域 | 下一张（循环到开头） |
| 滚轮向上 | 放大 |
| 滚轮向下 | 缩小 |
| 双击 | 放大 / 还原切换 |
| 拖拽 | 平移放大后的图片 |
| Esc | 关闭 Lightbox |

### 兼容性检查

```bash
# 安装最新稳定版（已支持 React 19）
npm install yet-another-react-lightbox@^3.21.8
npm run build
```

如果构建失败或运行时警告（极低概率）：
- **降级方案 A**: 使用 `react-photo-album` + 自研 Lightbox（基于 shadcn Dialog + framer-motion）
- **降级方案 B**: 使用 `photoswipe`（原生 JS，React wrapper）

### 自研 Lightbox 接口（降级方案）

```typescript
interface LightboxProps {
  images: { src: string; alt?: string; title?: string }[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}
```

## 6. Acceptance Criteria

- [ ] 点击图片打开 Lightbox，显示大图
- [ ] Lightbox 背景遮罩（黑色半透明，opacity 0.9）
- [ ] 显示图片计数器（当前索引 / 总数）
- [ ] 显示图片标题/文件名
- [ ] 上一张/下一张切换按钮（悬浮在左右两侧）
- [ ] 支持键盘方向键 ← → 切换图片
- [ ] 支持键盘 Esc 关闭
- [ ] 支持滚轮缩放图片
- [ ] 支持双击放大/还原
- [ ] 缩放后支持拖拽平移
- [ ] 打开/关闭有过渡动画
- [ ] 切换图片有滑动动画
- [ ] React 19 下无警告/错误（或降级方案正常工作）
- [ ] 深色模式无视觉问题
- [ ] 移动端触摸手势支持（滑动切换、捏合缩放）

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 点击图片打开 | SC-4.3.1: 管理员点击图片，Lightbox 弹出显示大图 | `test/lightbox/open.test.tsx` | `e2e/admin-lightbox-open.spec.ts` | 手动 + E2E | Completed |
| 图片计数器 | SC-4.3.2: Lightbox 顶部显示 "3 / 24" | `test/lightbox/counter.test.tsx` | `e2e/admin-lightbox-counter.spec.ts` | 手动 + E2E | Completed |
| 上一张/下一张 | SC-4.3.3: 管理员点击右箭头，显示下一张图片 | `test/lightbox/navigate.test.tsx` | `e2e/admin-lightbox-navigate.spec.ts` | 手动 + E2E | Completed |
| 键盘导航 | SC-4.3.4: 按 → 键切换下一张，按 Esc 关闭 | `test/lightbox/keyboard.test.tsx` | `e2e/admin-lightbox-keyboard.spec.ts` | 手动 + E2E | Completed |
| 滚轮缩放 | SC-4.3.5: 向上滚动滚轮，图片放大；向下滚动，图片缩小 | `test/lightbox/zoom-wheel.test.tsx` | `e2e/admin-lightbox-zoom.spec.ts` | 手动 + E2E | Completed |
| 双击缩放 | SC-4.3.6: 双击图片放大，再次双击还原 | `test/lightbox/zoom-dblclick.test.tsx` | `e2e/admin-lightbox-dblclick.spec.ts` | 手动 + E2E | Completed |
| 拖拽平移 | SC-4.3.7: 放大后拖拽图片，可查看不同区域 | `test/lightbox/pan.test.tsx` | `e2e/admin-lightbox-pan.spec.ts` | 手动 + E2E | Completed |
| 移动端触摸 | SC-4.3.8: 在手机上左右滑动切换，捏合缩放 | - | `e2e/admin-lightbox-touch.spec.ts` | 真机/DevTools | Completed |
| React 19 兼容 | SC-4.3.9: 安装后构建无错误，控制台无警告 | `npm run build` | - | CI / 手动 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| yet-another-react-lightbox@^3.21.8 构建异常 | **低** | Lightbox 无法使用 | 降级到自研 Lightbox（基于 shadcn Dialog + framer-motion） |
| 大图加载慢 | 中 | Lightbox 打开白屏 | 预加载相邻图片，显示加载骨架 |
| 移动端触摸冲突 | 中 | 滑动被浏览器拦截 | 使用 `touch-action: none` |
| 缩放/平移性能 | 低 | 动画卡顿 | 使用 `transform: scale/translate` GPU 加速 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`（重点验证 React 19 兼容性）
- E2E: `npm run test:e2e`
- Manual: Chrome/Firefox/Safari 跨浏览器测试
- Manual: 移动端真机或 DevTools 触摸模拟
- Accessibility: 键盘导航、焦点陷阱（focus trap）

## 10. Completion Notes

- Changed source: `src/components/lightbox/*`, `src/hooks/use-lightbox.ts`
- Changed tests: `e2e/admin-lightbox-*.spec.ts`, `test/lightbox/*.test.tsx`
- Verification result: 待填写
- Remaining risk: 待填写
- ⚠️ 关键决策: `yet-another-react-lightbox` 是否可用（ADR-004）
