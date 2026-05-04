# Phase Spec: Phase 5 - 移动端适配与响应式优化

> **Phase ID**: PHASE-5
> **Status**: Completed
> **Priority**: P2
> **预估工期**: 3 天
> **Master Spec**: `docs/tasks/README.md`

---

## 1. 阶段目标

将管理后台和博客端全面适配移动端，确保在平板和手机上的基础可用性，建立响应式测试矩阵并修复所有响应式 Bug。

## 2. 业务价值

- 管理后台可在移动设备上应急使用
- 博客访客获得良好的移动端阅读体验
- 减少因设备差异导致的用户流失

## 3. 涉及模块

### 页面（管理后台）

- 所有 `/admin/*` 页面（Sidebar、表格、表单）
- Dashboard `/admin/dashboard`
- 文章管理 `/admin/articles/*`
- 评论/留言管理 `/admin/comments`, `/admin/messages`
- 说说管理 `/admin/talks`
- 相册管理 `/admin/albums/*`
- 分类/标签管理 `/admin/categories`, `/admin/tags`
- 日志 `/admin/logs`
- 站点设置 `/admin/settings`

### 页面（博客端）

- 首页 `/`
- 归档 `/archives`
- 分类 `/categories`
- 标签 `/tags`
- 文章详情 `/articles/:id`
- 说说 `/talks`
- 留言 `/message`
- 友链 `/links`
- 关于 `/about`

### 新增/修改组件

- `AdminSidebar` - Drawer 模式
- `AdminHeader` - 汉堡按钮
- `DataTable` - 横向滚动 + 列隐藏
- `DataTableToolbar` - 移动端适配
- `DataTablePagination` - 移动端简化
- `BlogNavbar` - 汉堡菜单
- `ArticleCard` - 响应式列数

## 4. 任务清单

| Task ID | 任务名称 | 预估 | 依赖 | 状态 |
|---------|---------|------|------|------|
| TASK-5.1 | 管理后台 Sidebar 移动端适配 | 0.5 天 | 无 | Completed |
| TASK-5.2 | 数据表格移动端适配 | 0.5 天 | TASK-1.2, TASK-5.1 | Completed |
| TASK-5.3 | 表单页移动端适配 | 0.5 天 | TASK-5.1 | Completed |
| TASK-5.4 | 博客端响应式优化 | 0.5 天 | 无 | Completed |
| TASK-5.5 | 全局响应式测试与修复 | 1 天 | TASK-5.1, TASK-5.2, TASK-5.3, TASK-5.4 | Completed |

## 5. 依赖关系

```
TASK-5.1 (Sidebar 适配)    TASK-5.4 (博客端适配)
    ↓                            ↓
TASK-5.2 (表格适配)        TASK-5.5 (全局测试)
    ↓                      ↑
TASK-5.3 (表单适配) ────────┘
```

TASK-5.1 和 TASK-5.4 可并行。
TASK-5.2 依赖 TASK-5.1（Sidebar 先适配，表格才有空间）。
TASK-5.3 依赖 TASK-5.1。
TASK-5.5 依赖所有前置 Task。

## 6. 阶段级验收标准

- [ ] 管理后台 Sidebar 在移动端为 Drawer 抽屉
- [ ] 管理后台表格在移动端可横向滚动
- [ ] 管理后台表格次要列在移动端隐藏
- [ ] 管理后台表单在移动端为单列布局
- [ ] 管理后台输入框触摸目标 ≥ 44px
- [ ] 管理后台按钮在移动端全宽
- [ ] 博客导航栏在移动端为汉堡菜单
- [ ] 博客文章列表响应式列数（3/2/1）
- [ ] 博客文章详情页在移动端可读（字号 ≥ 16px）
- [ ] 无页面横向滚动（代码块、表格除外）
- [ ] 所有交互元素触摸目标 ≥ 44px
- [ ] 测试报告输出
- [ ] Lighthouse 博客端移动端评分 ≥ 80
- [ ] TypeScript 编译无错误
- [ ] ESLint 无错误
- [ ] 深色模式无视觉问题

## 7. 阶段级风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 真机测试设备不足 | 中 | 遗漏真机兼容问题 | 使用 DevTools 模拟 + 邀请用户测试 |
| 修改影响桌面端布局 | 中 | 回归问题 | 每次修改后在桌面端验证 |
| 第三方组件响应式支持差 | 低 | 部分组件无法适配 | 记录为已知限制，后续替换 |
| MDEditor 移动端体验差 | 中 | 文章编辑在手机上困难 | 测试评估，准备只读降级 |
| Bug 数量超出预期 | 中 | 工期延长 | 区分优先级，先修复阻断性 Bug |

## 8. Definition of Done

Phase 5 完成时必须满足：

- [ ] 所有 Task 状态为 Done 或 Waived
- [ ] 追踪表 Verification 列全部通过
- [ ] BDD 场景已新增/更新
- [ ] E2E 测试已新增或记录豁免
- [ ] TypeScript 编译无错误 (`npx tsc --noEmit`)
- [ ] ESLint 无错误 (`npm run lint`)
- [ ] 测试报告已输出 (`docs/tasks/phase-5/responsive-test-report.md`)
- [ ] 所有 P0 Bug 已修复
- [ ] 桌面端布局无回归
- [ ] 深色模式切换无视觉问题
- [ ] 无主 TODO、临时 mock、placeholder
- [ ] 剩余风险已记录

## 9. Task Spec 索引

| Task ID | 文件 |
|---------|------|
| TASK-5.1 | `docs/tasks/phase-5/TASK-5.1.md` |
| TASK-5.2 | `docs/tasks/phase-5/TASK-5.2.md` |
| TASK-5.3 | `docs/tasks/phase-5/TASK-5.3.md` |
| TASK-5.4 | `docs/tasks/phase-5/TASK-5.4.md` |
| TASK-5.5 | `docs/tasks/phase-5/TASK-5.5.md` |

## 10. BDD Feature 文件

`docs/tasks/acceptance/phase-5.feature`

## 11. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本 |
