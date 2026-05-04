# Task 5.4: 博客端响应式优化

> **Task ID**: TASK-5.4
> **Phase**: PHASE-5
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: 无

---

## 1. Background

博客端（`(blog)/` 路由）是面向访客的前台页面，当前在移动端存在导航不便、文章列表列数固定、字体过小等问题。根据 Master Spec 范围，博客端仅做响应式适配，不涉及功能增强。

## 2. Goal

对博客端所有页面进行响应式优化，确保在手机和平板上浏览体验良好。

## 3. Scope

### In Scope

- 导航栏汉堡菜单（移动端）
- 文章列表响应式列数（桌面 3 列 / 平板 2 列 / 手机 1 列）
- 文章详情页阅读体验（字体大小、行宽、边距）
- 归档/分类/标签页响应式
- 说说/留言页响应式
- 页脚响应式

### Out of Scope

- 博客端功能新增
- 主题系统改造
- 深色模式（已有）
- PWA 支持

## 4. Users / Actors

- **访客**: 在手机、平板上浏览博客

## 5. Behavior Contract

### 导航栏

```
桌面端:
┌──────────────────────────────────────────────┐
│ 🏠 首页    归档    分类    标签    说说  关于  │
└──────────────────────────────────────────────┘

移动端:
┌─────────────────────┐
│ ☰  博客名称          │
└─────────────────────┘
点击 ☰:
┌─────────────────────┐
│ 博客名称        [×]  │
│─────────────────────│
│ 🏠 首页              │
│ 📁 归档              │
│ 🏷 分类              │
│ 🏷 标签              │
│ 💬 说说              │
│ ℹ 关于              │
└─────────────────────┘
```

- 导航栏在 md 以下变为汉堡菜单
- 菜单从顶部展开（或 Drawer）
- 当前页面高亮

### 文章列表

| 断点 | 列数 | 每行卡片数 |
|------|------|-----------|
| ≥1024px (lg) | 3 列 | 3 |
| ≥768px (md) | 2 列 | 2 |
| <768px (sm) | 1 列 | 1 |

### 文章详情页

- 内容区最大宽度：桌面 720px，移动端 100% - 32px padding
- 正文字号：桌面 `text-lg` (18px)，移动端 `text-base` (16px)
- 行高：桌面 `leading-relaxed` (1.625)，移动端 `leading-normal` (1.5)
- 代码块：横向滚动，不换行
- 图片：最大 100% 宽度，自适应高度

### 说说/留言页

- 列表单列
- 头像 + 内容水平排列 → 移动端垂直排列（头像在上）
- 输入框全宽

## 6. Acceptance Criteria

- [ ] 博客导航栏在移动端显示汉堡菜单
- [ ] 汉堡菜单可展开/收起
- [ ] 文章列表响应式列数（3/2/1）
- [ ] 文章卡片在移动端全宽显示
- [ ] 文章详情页正文字号移动端 ≥ 16px
- [ ] 文章详情页内容区在移动端有适当边距
- [ ] 代码块在移动端可横向滚动
- [ ] 图片在移动端不溢出屏幕
- [ ] 归档/分类/标签页在移动端单列显示
- [ ] 说说/留言列表在移动端头像与内容垂直排列
- [ ] 页脚在移动端垂直堆叠
- [ ] 所有博客端页面在移动端无需横向滚动（代码块除外）
- [ ] 深色模式无视觉问题

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 汉堡菜单 | SC-5.4.1: 访客在手机上打开博客，导航栏显示汉堡按钮 | `test/blog/nav-mobile.test.tsx` | `e2e/blog-nav-mobile.spec.ts` | 手动 + E2E | Not Started |
| 菜单展开 | SC-5.4.2: 点击汉堡按钮，导航菜单展开 | `test/blog/nav-expand.test.tsx` | `e2e/blog-nav-expand.spec.ts` | 手动 + E2E | Not Started |
| 文章列表列数 | SC-5.4.3: 调整浏览器宽度，文章列表列数自动变化 | `test/blog/article-grid.test.tsx` | `e2e/blog-article-grid.spec.ts` | DevTools | Not Started |
| 文章详情字号 | SC-5.4.4: 在手机上文章正文可读，字号 ≥ 16px | `test/blog/article-font.test.tsx` | `e2e/blog-article-font.spec.ts` | DevTools | Not Started |
| 代码块滚动 | SC-5.4.5: 文章中的代码块在手机上可横向滚动 | `test/blog/code-scroll.test.tsx` | `e2e/blog-code-scroll.spec.ts` | 手动 + E2E | Not Started |
| 说说头像排列 | SC-5.4.6: 在手机上说说列表头像与内容垂直排列 | `test/blog/talks-layout.test.tsx` | `e2e/blog-talks-layout.spec.ts` | 手动 + E2E | Not Started |
| 所有页面覆盖 | SC-5.4.7: 博客端所有页面在移动端均可正常浏览 | - | `e2e/blog-all-pages.spec.ts` | 手动 | Not Started |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 现有样式冲突 | 中 | 部分组件样式异常 | 使用 Tailwind 响应式前缀，逐步测试 |
| Markdown 渲染样式难适配 | 中 | 文章详情页显示异常 | 使用 Tailwind Typography 插件 `prose` 类 |
| 第三方组件（如评论插件）不响应式 | 低 | 评论区显示异常 | 检查第三方组件响应式支持 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome DevTools 设备模拟（各博客页面）
- Manual: 真机测试（如可用）
- Performance: Lighthouse 移动端评分

## 10. Completion Notes

- Changed source: `src/app/(blog)/*/page.tsx`, `src/components/blog-navbar.tsx`, `src/components/blog-footer.tsx`, `src/components/article-card.tsx`
- Changed tests: `e2e/blog-*.spec.ts`, `test/blog/*.test.tsx`
- Verification result: 待填写
- Remaining risk: 待填写
