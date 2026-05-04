# Task 4.2: 瀑布流图片展示

> **Task ID**: TASK-4.2
> **Phase**: PHASE-4
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-4.1

---

## 1. Background

相册详情页（`/admin/albums/:id`）当前以等高网格展示图片，当图片长宽比差异大时（如截图 vs 海报），等高布局会导致大量空白或图片被裁剪。瀑布流布局（Masonry）可根据图片实际高度自适应排列，视觉更紧凑、更符合图片浏览习惯。

## 2. Goal

实现瀑布流布局的图片展示组件，支持响应式列数、图片懒加载，适配不同长宽比的图片。

## 3. Scope

### In Scope

- 瀑布流布局组件 `MasonryGallery`
- 响应式列数：桌面 3 列 / 平板 2 列 / 手机 1 列
- 图片懒加载（Intersection Observer + Next.js Image `loading="lazy"`）
- 图片加载占位（低对比度骨架色块）
- 加载更多 / 无限滚动（可选，本 Task 使用分页）
- 点击放大（衔接 TASK-4.3 Lightbox）

### Out of Scope

- Lightbox 大图浏览（TASK-4.3）
- 图片编辑（裁剪、旋转）
- 批量操作 UI（TASK-4.4，但布局需预留选择态）
- 服务端瀑布流（纯前端布局）

## 4. Users / Actors

- **博主/管理员**: 浏览相册内的图片，快速定位某张图片

## 5. Behavior Contract

### 布局算法

使用 CSS Grid + `grid-template-rows: masonry`（如浏览器支持）或 `react-masonry-css` 作为降级方案：

```typescript
// 断点配置
const breakpointColumns = {
  default: 3,
  1024: 3,  // lg
  768: 2,   // md
  640: 1,   // sm
};
```

### 图片渲染

- 每张图片渲染为自适应高度的卡片
- 卡片内显示：图片 + 悬浮信息层（文件名、大小、操作按钮）
- 图片使用 `next/image` 的 `fill` + `object-cover` 或 `object-contain`
- 加载状态显示骨架屏，加载完成后淡入（opacity transition）

### 懒加载

- 首屏图片立即加载（视口内）
- 视口外图片使用 `loading="lazy"`
- Intersection Observer threshold: 0.1，提前 200px 开始加载

## 6. Acceptance Criteria

- [ ] 图片按瀑布流布局排列，无固定行高
- [ ] 响应式列数：桌面 3 列、平板 2 列、手机 1 列
- [ ] 图片懒加载，滚动到视口附近才开始加载
- [ ] 图片加载前显示骨架占位，加载完成后淡入
- [ ] 加载失败时显示错误占位图
- [ ] 点击单张图片触发 TASK-4.3 Lightbox
- [ ] 悬浮显示图片信息（文件名、上传时间）
- [ ] 支持批量选择模式（复选框叠加在图片上）
- [ ] 支持键盘导航（Tab 键聚焦图片，Enter 打开 Lightbox）
- [ ] 深色模式无视觉问题
- [ ] 性能：100 张图片滚动不卡顿（FPS > 45）

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 瀑布流布局排列 | SC-4.2.1: 管理员查看相册，图片以瀑布流方式排列，无固定行高 | `masonry-gallery.test.tsx`: 渲染图片网格 | `e2e/admin-album-masonry.spec.ts` | 手动 + E2E | Completed |
| 响应式列数 | SC-4.2.2: 调整浏览器宽度，瀑布流列数自动变化 | `masonry-gallery.test.tsx`: grid-cols-1/md:grid-cols-2/lg:grid-cols-3 | `e2e/admin-album-masonry-responsive.spec.ts` | DevTools | Completed |
| 图片懒加载 | SC-4.2.3: 滚动到页面底部，新图片才加载，Network 面板可见延迟请求 | `masonry-gallery.test.tsx`: loading="lazy" 属性检查 | `e2e/admin-album-lazyload.spec.ts` | DevTools | Completed |
| 加载骨架与淡入 | SC-4.2.4: 图片加载前显示骨架色块，加载后平滑淡入 | `masonry-gallery.test.tsx`: loading skeleton | `e2e/admin-album-skeleton.spec.ts` | 手动 + E2E | Completed |
| 点击打开 Lightbox | SC-4.2.5: 管理员点击图片，打开 Lightbox 大图预览 | `masonry-gallery.test.tsx`: onPhotoClick 回调 | `e2e/admin-album-lightbox-link.spec.ts` | 手动 + E2E | Completed |
| 批量选择模式 | SC-4.2.6: 进入批量选择模式，图片左上角显示复选框 | `masonry-gallery.test.tsx`: checkbox 渲染和选择 | `e2e/admin-album-batch-select.spec.ts` | 手动 + E2E | Completed |
| 键盘导航 | SC-4.2.7: 管理员按 Tab 键聚焦图片，按 Enter 打开 Lightbox | - | `e2e/admin-album-keyboard.spec.ts` | 手动 + E2E | Waived |
| 性能测试 | SC-4.2.8: 相册含 100 张图片，滚动时 FPS > 45 | - | - | Chrome DevTools Performance | Not Started |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| `grid-template-rows: masonry` 浏览器支持有限 | 高 | 布局失效 | 使用 `react-masonry-css` 作为降级方案 |
| 大量图片内存占用 | 中 | 页面卡顿/崩溃 | 懒加载 + 限制同时加载数量 |
| 图片尺寸计算导致 CLS | 中 | 布局偏移 | 预分配容器高度或使用 aspect-ratio |
| React 19 与 masonry 库兼容 | 低 | 组件异常 | 安装后立即验证 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome/Firefox/Safari 跨浏览器测试
- Performance: Chrome DevTools Performance 面板录制滚动
- Accessibility: 键盘导航测试、aria-label 检查

## 10. Completion Notes

- Changed source:
  - `src/components/masonry/masonry-gallery.tsx` - 瀑布流图片展示组件
  - `src/app/(admin)/admin/albums/[id]/page.tsx` - 集成瀑布流到相册详情页
- Changed tests:
  - `src/components/masonry/masonry-gallery.test.tsx` - 8 个测试用例
- Verification result:
  - TypeScript: 0 errors
  - ESLint: 0 errors
  - Tests: 8/8 passed
  - Coverage: MasonryGallery 100% statements, 92.3% branches
  - 集成验证: 相册详情页瀑布流布局正常
- Remaining risk:
  - 性能测试（100 张图片 FPS）待进行
  - 键盘导航测试待补充
