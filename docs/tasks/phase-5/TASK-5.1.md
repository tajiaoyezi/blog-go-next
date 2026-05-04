# Task 5.1: 管理后台 Sidebar 移动端适配

> **Task ID**: TASK-5.1
> **Phase**: PHASE-5
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: 无

---

## 1. Background

当前管理后台 Sidebar 在桌面端为固定左侧导航，但在移动端（屏幕宽度 < 768px）Sidebar 占据大量空间导致主内容区几乎不可见。管理后台需要支持平板和手机上的基础操作，Sidebar 的移动端适配是首要任务。

## 2. Goal

将管理后台 Sidebar 在移动端改造为 Drawer 抽屉模式，通过汉堡按钮触发，点击遮罩关闭，保持所有导航功能可用。

## 3. Scope

### In Scope

- Sidebar 移动端隐藏，显示汉堡按钮
- 点击汉堡按钮打开 Drawer 抽屉
- Drawer 从左侧滑入，带遮罩层
- 点击遮罩层关闭 Drawer
- Drawer 内保持完整的导航菜单
- Drawer 打开时锁定背景滚动
- 选中项高亮保持
- Drawer 宽度占屏幕 80%，最大 320px

### Out of Scope

- 底部 Tab 导航（后续优化可考虑）
- Sidebar 折叠/展开动画（桌面端已有）
- 导航菜单项增减或重排

## 4. Users / Actors

- **博主/管理员**: 在手机或平板上访问管理后台，需要导航到不同页面

## 5. Behavior Contract

### 响应式断点

| 断点 | Sidebar 行为 |
|------|-------------|
| ≥768px (md) | 固定左侧展开，显示完整 Sidebar |
| <768px (sm) | 隐藏 Sidebar，显示汉堡按钮 |

### Drawer 交互

```
移动端:
┌──────────────────────────┐
│ ☰  Dashboard             │  ← 汉堡按钮在 Header 左侧
│──────────────────────────│
│                          │
│   [主内容区]              │
│                          │
└──────────────────────────┘

点击 ☰ 后:
┌────────┬─────────────────┐
│ Logo   │  Dashboard      │
│────────│                 │
│ 🏠 首页 │                 │
│ 📝 文章 │    [遮罩层]      │
│ 🖼 相册 │                 │
│ ⚙ 设置 │                 │
│        │                 │
└────────┴─────────────────┘
```

### 动画

- Drawer 滑入：300ms ease-out
- 遮罩淡入：200ms ease-out
- 关闭反向动画
- 使用 framer-motion `AnimatePresence`

## 6. Acceptance Criteria

- [ ] 屏幕宽度 < 768px 时 Sidebar 自动隐藏
- [ ] Header 左侧显示汉堡菜单按钮
- [ ] 点击汉堡按钮打开 Drawer，从左侧滑入
- [ ] Drawer 显示完整导航菜单
- [ ] Drawer 打开时背景显示半透明遮罩
- [ ] 点击遮罩层关闭 Drawer
- [ ] Drawer 打开时背景不可滚动
- [ ] 选中菜单项在 Drawer 中高亮显示
- [ ] Drawer 关闭后恢复背景滚动
- [ ] 屏幕宽度 ≥ 768px 时恢复桌面 Sidebar 布局
- [ ] 窗口大小改变时自动切换模式（无需刷新）
- [ ] 动画流畅无卡顿
- [ ] 深色模式 Drawer 背景色正确

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 移动端隐藏 Sidebar | SC-5.1.1: 管理员在手机上打开管理后台，Sidebar 不可见，显示汉堡按钮 | `test/sidebar/mobile-hide.test.tsx` | `e2e/admin-sidebar-mobile.spec.ts` | DevTools + 真机 | Not Started |
| 点击打开 Drawer | SC-5.1.2: 点击汉堡按钮，Drawer 从左侧滑入 | `test/sidebar/drawer-open.test.tsx` | `e2e/admin-sidebar-drawer.spec.ts` | 手动 + E2E | Not Started |
| 遮罩关闭 | SC-5.1.3: 点击遮罩层，Drawer 关闭 | `test/sidebar/drawer-close.test.tsx` | `e2e/admin-sidebar-close.spec.ts` | 手动 + E2E | Not Started |
| 背景滚动锁定 | SC-5.1.4: Drawer 打开时，背景内容不可滚动 | `test/sidebar/scroll-lock.test.tsx` | `e2e/admin-sidebar-scroll.spec.ts` | 手动 + E2E | Not Started |
| 选中项高亮 | SC-5.1.5: Drawer 中当前页面菜单项高亮 | `test/sidebar/active-item.test.tsx` | `e2e/admin-sidebar-active.spec.ts` | 手动 + E2E | Not Started |
| 响应式切换 | SC-5.1.6: 调整浏览器宽度跨越 768px，布局自动切换 | - | `e2e/admin-sidebar-responsive.spec.ts` | DevTools | Not Started |
| 深色模式 | SC-5.1.7: 深色模式下 Drawer 背景色正确，无视觉问题 | `test/sidebar/dark-mode.test.tsx` | `e2e/admin-sidebar-dark.spec.ts` | 手动 + E2E | Not Started |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| shadcn Sheet 组件不满足需求 | 低 | 需自研 Drawer | Sheet 已支持方向/尺寸定制 |
| 滚动锁定与现有逻辑冲突 | 中 | 页面异常 | 使用 `useScrollLock` hook，测试覆盖 |
| 动画性能（低端手机） | 中 | 卡顿 | 使用 `transform` GPU 加速，低端机关闭动画 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome DevTools 设备模拟（iPhone SE, iPhone 14, iPad）
- Manual: 真机测试（如可用）
- Accessibility: 汉堡按钮 aria-label、焦点管理

## 10. Completion Notes

- Changed source: `src/components/admin-sidebar.tsx`, `src/components/admin-header.tsx`, `src/hooks/use-media-query.ts`
- Changed tests: `e2e/admin-sidebar-*.spec.ts`, `test/sidebar/*.test.tsx`
- Verification result: 待填写
- Remaining risk: 待填写
