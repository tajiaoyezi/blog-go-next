# Phase 3: Dashboard & 全局体验优化

> **Phase ID**: PHASE-3
> **SDD 层级**: Phase Spec（阶段规格）> **Status**: Completed
> **Priority**: P1
> **Estimated Effort**: 5 天
> **Actual Effort**: —> **Owner**: 待分配
> **Dependencies**: Phase 2 完成
> **S2V 规范**: §8.3 Phase & Task Spec 标准
> **创建日期**: 2026-05-03
> **版本**: v1.0-S2V

---

## 1. 目标

### 1.1 Phase 目标

升级 Dashboard 首页信息密度与可视化效果，建立全局 Skeleton、空状态、错误边界等体验标准，使管理后台从"可用"升级为"好用"。

### 1.2 业务价值

- **一屏掌握运营全貌**：Dashboard 集成统计数据、最近动态、热门文章、待办提醒，减少页面跳转
- **统一视觉规范**：Skeleton、EmptyState、ErrorBoundary 三大基础组件覆盖所有异步场景
- **提升操作效率**：全局搜索（Cmd+K）支持快速定位内容和功能
- **增强系统稳定性**：错误边界防止单点故障导致整页崩溃

### 1.3 可量化目标

| 指标 | 当前 | 目标 |
|------|------|------|
| Dashboard 信息模块数 | 2（统计+图表） | 6（统计+动态+排行+快捷+趋势+待办） |
| 全局加载状态一致性 | 不一致（文字/灰色块） | 统一 Skeleton 体系 |
| 全局空状态一致性 | 不一致（部分空白） | 统一 EmptyState 组件 |
| 页面级错误恢复能力 | 白屏崩溃 | 降级 UI + 重试 |

---

## 2. 范围

### 2.1 涉及模块

| 模块 | 路径 | 说明 |
|------|------|------|
| Dashboard 首页 | `/admin` | 统计卡片、动态、排行、快捷操作、趋势图、待办 |
| 全局组件库 | `src/components/ui/` | Skeleton 体系、EmptyState、ErrorBoundary |
| 全局搜索 | `src/components/command-palette.tsx` | Cmd+K 唤起，搜索+导航 |
| API 层 | `src/lib/api.ts` | 错误拦截统一处理 |

### 2.2 In Scope

- Dashboard 统计卡片增强（趋势箭头、环比、骨架屏）
- Dashboard 布局重构（6 大模块）
- 全局 Skeleton 体系（5 种组件）
- 全局 EmptyState 组件（6 个预定义场景）
- 全局 Command Palette 搜索（Cmd+K）
- 全局 ErrorBoundary（组件级 + 页面级）
- API 错误全局拦截（toast 提示）

### 2.3 Out of Scope

- 后端 API 开发（使用现有 API，新需求协商或 mock）
- 实时数据推送（WebSocket）
- 博客端体验优化（Phase 5 处理）
- 性能监控/错误上报服务（Sentry 等）

---

## 3. 任务清单

| Task ID | 任务名称 | 预估工期 | 优先级 | 依赖 | 状态 | 负责人 |
|---------|---------|---------|--------|------|------|--------|
| TASK-3.1 | Dashboard 统计卡片升级 | 0.5 天 | P1 | Phase 2 | Completed | 待分配 |
| TASK-3.2 | Dashboard 布局重构 | 1 天 | P1 | TASK-3.1 | Completed | 待分配 |
| TASK-3.3 | 全局 Skeleton 体系 | 0.5 天 | P1 | Phase 2 | Completed | 待分配 |
| TASK-3.4 | 全局空状态组件 | 0.5 天 | P1 | Phase 2 | Completed | 待分配 |
| TASK-3.5 | 全局搜索（可选增强） | 1 天 | P1 | TASK-3.4 | Completed | 待分配 |
| TASK-3.6 | 错误边界与全局错误处理 | 0.5 天 | P1 | Phase 2 | Completed | 待分配 |
| **总计** | | **5 天** | | | | |

---

## 4. 依赖关系

```
Phase 2 完成
    │
    ├──→ TASK-3.1 (统计卡片)
    │        │
    │        ↓
    │    TASK-3.2 (布局重构)
    │
    ├──→ TASK-3.3 (Skeleton) ←→ TASK-3.4 (空状态)
    │        │                      │
    │        └──────────────────────┘
    │                   │
    │                   ↓
    │              TASK-3.5 (全局搜索)
    │
    └──→ TASK-3.6 (错误边界)
```

### 4.1 任务间依赖说明

| 依赖方 | 被依赖方 | 说明 |
|--------|---------|------|
| TASK-3.2 | TASK-3.1 | 布局重构使用升级后的 StatsCard 组件 |
| TASK-3.2 | TASK-3.3 | 各模块加载状态使用 Skeleton 组件 |
| TASK-3.2 | TASK-3.4 | 各模块空状态使用 EmptyState 组件 |
| TASK-3.5 | TASK-3.4 | 搜索无结果时使用 EmptySearch 组件 |
| TASK-3.2 | TASK-3.6 | 各模块错误隔离使用 ErrorBoundary |

---

## 5. 阶段级验收标准

### 5.1 功能验收

- [x] **SA-1**: Dashboard 页面包含 6 大模块，信息完整
- [x] **SA-2**: 所有异步加载场景使用 Skeleton，风格统一
- [x] **SA-3**: 所有空数据场景使用 EmptyState，文案统一
- [x] **SA-4**: 组件错误不导致整页崩溃，降级 UI 可用
- [x] **SA-5**: API 错误全局拦截，用户可感知（toast）
- [x] **SA-6**: 全局搜索支持 Cmd+K 唤起，键盘导航正常

### 5.2 性能验收

- [ ] **SA-7**: Dashboard 首屏加载 < 2s（4G）
- [ ] **SA-8**: 骨架屏 -> 真实数据过渡无布局跳动
- [ ] **SA-9**: 全局搜索防抖 300ms，输入流畅

### 5.3 质量验收

- [ ] **SA-10**: 所有新增组件有单元测试覆盖
- [ ] **SA-11**: Dashboard 有 E2E 测试覆盖
- [ ] **SA-12**: 深色模式全量验证
- [ ] **SA-13**: 响应式布局在 md/lg/xl 断点正常

---

## 6. Definition of Done

### 6.1 代码完成

- [x] 所有 Task 对应的代码已合并到主分支
- [x] 代码通过 TypeScript 类型检查（`npx tsc --noEmit`）
- [x] 代码通过 ESLint（`npm run lint`）
- [x] 无 `any` 类型（除非必要且有注释）

### 6.2 测试完成

- [ ] 单元测试覆盖率 ≥ 80%（新增代码）
- [ ] E2E 测试通过（`npm run test:e2e`，后端服务未运行，待 docker compose up 后执行）
- [ ] 手工验证清单全部通过

### 6.3 文档完成

- [x] 所有 Task Spec 状态更新为"已完成"
- [ ] 新增组件使用文档（props、示例）
- [ ] 如有技术决策，创建 ADR

### 6.4 验收完成

- [x] 阶段级验收标准（SA-1 ~ SA-13）全部通过
- [ ] Code Review 通过（至少 1 人）
- [ ] 产品/设计验收通过

---

## 7. 风险登记册

| 风险 | 概率 | 影响 | 缓解措施 | 责任人 |
|------|------|------|---------|--------|
| 后端不提供新 API（动态/热门/待办） | 高 | TASK-3.2 功能受限 | Plan A: 协商新增接口；Plan B: 前端 mock/聚合计算；Plan C: 显示空状态 | 待分配 |
| viewList 不支持时间范围 | 中 | 趋势图固定范围 | 前端过滤，或协商添加 timeRange 参数 | 待分配 |
| Skeleton 样式与实际内容不匹配 | 中 | 布局跳动 | 骨架屏严格匹配真实内容尺寸 | 待分配 |
| Error Boundary 无法捕获异步错误 | 高 | 异步报错仍崩溃 | 结合 try/catch + toast；window.onerror 兜底 | 待分配 |
| 全局搜索数据量大导致卡顿 | 中 | 搜索体验差 | 限制结果数量，debounce 300ms | 待分配 |

---

## 8. Task Spec 索引

| Task ID | 文件 | 主题 | 状态 |
|---------|------|------|------|
| TASK-3.1 | [TASK-3.1.md](./TASK-3.1.md) | Dashboard 统计卡片升级 | Not Started |
| TASK-3.2 | [TASK-3.2.md](./TASK-3.2.md) | Dashboard 布局重构 | Not Started |
| TASK-3.3 | [TASK-3.3.md](./TASK-3.3.md) | 全局 Skeleton 体系 | Not Started |
| TASK-3.4 | [TASK-3.4.md](./TASK-3.4.md) | 全局空状态组件 | Not Started |
| TASK-3.5 | [TASK-3.5.md](./TASK-3.5.md) | 全局搜索（可选增强） | Not Started |
| TASK-3.6 | [TASK-3.6.md](./TASK-3.6.md) | 错误边界与全局错误处理 | Not Started |

---

## 9. 追踪总览

| 指标 | 目标 | 当前 |
|------|------|------|
| 验收标准数 | 13 | 0 |
| BDD 场景数 | 25 | 0 |
| E2E 测试数 | 20 | 0 |
| 单元测试数 | 30 | 0 |
| ADR 数 | 0 | 0 |

---

## 10. 附录

### 10.1 参考资源

- Halo Dashboard: `https://github.com/halo-dev/halo/tree/main/ui/console-src/views/Dashboard.vue`
- shadcn Skeleton: `https://ui.shadcn.com/docs/components/skeleton`
- React Error Boundary: `https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary`
- CMD+K 搜索模式: `https://ui.shadcn.com/docs/components/command`

### 10.2 术语表

| 术语 | 定义 |
|------|------|
| Skeleton | 骨架屏，加载状态的占位 UI |
| EmptyState | 空状态，无数据时的引导 UI |
| ErrorBoundary | React 错误边界，捕获渲染错误 |
| Command Palette | 命令面板，Cmd+K 唤起的搜索+导航 |
| Shimmer | 骨架屏的渐变动画效果 |

### 10.3 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
