# Task 5.5: 全局响应式测试与修复

> **Task ID**: TASK-5.5
> **Phase**: PHASE-5
> **Status**: Completed
> **Priority**: P2
> **Owner**: 待分配
> **Dependencies**: TASK-5.1, TASK-5.2, TASK-5.3, TASK-5.4

---

## 1. Background

Phase 5 的前 4 个 Task 分别针对特定模块做了移动端适配，但可能存在边界情况、交互冲突或遗漏页面。本 Task 进行系统性的跨设备测试，发现并修复所有响应式问题，确保管理后台和博客端在主流设备上均可用。

## 2. Goal

建立跨设备测试矩阵，执行系统性测试，修复所有响应式 Bug，形成测试报告。

## 3. Scope

### In Scope

- 跨设备测试矩阵设计与执行
- 管理后台所有页面移动端测试
- 博客端所有页面移动端测试
- 发现的所有响应式 Bug 修复
- 测试报告输出

### Out of Scope

- 性能优化（非响应式相关）
- 功能 Bug（非响应式相关）
- 老旧浏览器支持（IE11）

## 4. Users / Actors

- **博主/管理员**: 在不同设备上使用管理后台
- **访客**: 在不同设备上浏览博客

## 5. Behavior Contract

### 测试矩阵

| 设备类型 | 视口尺寸 | 浏览器 | 优先级 |
|---------|---------|--------|--------|
| 桌面大屏 | 1920x1080 | Chrome | P0 |
| 桌面标准 | 1440x900 | Chrome, Firefox, Safari | P0 |
| 平板横屏 | 1024x768 | Safari iPad | P1 |
| 平板竖屏 | 768x1024 | Safari iPad | P1 |
| 手机大屏 | 390x844 | Safari iOS | P0 |
| 手机小屏 | 375x667 | Safari iOS | P0 |
| 手机安卓 | 360x740 | Chrome Android | P1 |

### 检查清单（每设备）

- [ ] 页面无横向滚动条（代码块、表格除外）
- [ ] 所有按钮可点击（触摸目标 ≥ 44px）
- [ ] 文字可读（字号 ≥ 14px）
- [ ] 图片不溢出容器
- [ ] 表单可正常填写
- [ ] 导航可正常使用
- [ ] 深色模式无视觉问题
- [ ] 加载状态正常
- [ ] 空状态正常

## 6. Acceptance Criteria

- [ ] 完成测试矩阵中所有 P0 设备的测试
- [ ] 完成测试矩阵中至少 50% P1 设备的测试
- [ ] 所有发现的响应式 Bug 已修复或记录为已知问题
- [ ] 无横向滚动条（代码块、表格除外）
- [ ] 所有交互元素触摸目标 ≥ 44px
- [ ] 输出测试报告（Markdown 格式）
- [ ] 测试报告包含：设备清单、Bug 列表、修复状态、截图证据
- [ ] 管理后台在 iPhone SE 尺寸下基础功能可用
- [ ] 博客端在 iPhone SE 尺寸下完整可浏览
- [ ] Lighthouse 移动端评分 ≥ 80

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| P0 设备测试完成 | SC-5.5.1: 在 iPhone 14、桌面 Chrome、桌面 Safari 上完成全页面测试 | - | - | 测试报告 | Not Started |
| Bug 修复 | SC-5.5.2: 所有 P0 Bug 已修复，P1 Bug 已评估 | - | - | 测试报告 | Not Started |
| 触摸目标 | SC-5.5.3: 所有按钮和链接触摸目标 ≥ 44px | `test/responsive/touch-target.test.tsx` | - | DevTools | Not Started |
| 无横向滚动 | SC-5.5.4: 除表格和代码块外，无页面横向滚动 | - | `e2e/responsive-no-scroll.spec.ts` | 手动 | Not Started |
| 测试报告 | SC-5.5.5: 输出完整的响应式测试报告 | - | - | 文档审核 | Not Started |
| Lighthouse 评分 | SC-5.5.6: 博客端 Lighthouse 移动端评分 ≥ 80 | - | - | Lighthouse | Not Started |
| iPhone SE 可用 | SC-5.5.7: 管理后台在 375x667 下可完成文章查看和编辑 | - | `e2e/responsive-iphone-se.spec.ts` | 手动 | Not Started |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 真机设备不足 | 中 | 仅模拟器测试，遗漏真机问题 | 使用 BrowserStack 或邀请用户测试 |
| Bug 数量超出预期 | 中 | 工期延长 | 区分 P0/P1/P2，优先修复阻断性 Bug |
| 某些组件响应式改造影响桌面端 | 中 | 回归问题 | 每次修改后在桌面端验证 |
| 第三方库响应式问题无法修复 | 低 | 只能接受或替换库 | 记录为已知限制 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- E2E: `npm run test:e2e`
- Manual: Chrome DevTools 设备模拟（全部 P0 + 部分 P1）
- Manual: 真机测试（如可用）
- Performance: Lighthouse CI（博客端首页）
- Report: `docs/tasks/phase-5/responsive-test-report.md`

## 10. Completion Notes

- Changed source: 根据 Bug 修复情况决定
- Changed tests: `e2e/responsive-*.spec.ts`
- Verification result: 待填写
- Remaining risk: 待填写
- 测试报告: `docs/tasks/phase-5/responsive-test-report.md`
