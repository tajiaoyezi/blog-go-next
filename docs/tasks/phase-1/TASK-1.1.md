# Task 1.1: 安装依赖与创建基础组件

> **Task ID**: TASK-1.1
> **Phase**: PHASE-1
> **Status**: Completed
> **Priority**: P0
> **Owner**: 待分配
> **Dependencies**: 无

---

## 1. Background

Phase 1 需要为所有管理后台列表页提供统一的数据表格能力。`@tanstack/react-table` 是业界成熟的表格解决方案，与 React 生态深度集成，支持排序、筛选、分页、批量选择等高级功能。本任务是 Phase 1 的基础设施准备工作。

## 2. Goal

安装 `@tanstack/react-table` 依赖，并创建数据表格组件的目录结构和基础类型定义，为后续 Task 提供开发基础。

## 3. Scope

### In Scope

- 安装 `@tanstack/react-table` 依赖
- 创建 `src/components/data-table/` 目录结构
- 创建基础类型定义文件
- 验证安装成功

### Out of Scope

- 实现具体表格组件（Task 1.2）
- 集成到页面（Task 1.3+）
- 样式定制（Task 1.2）

## 4. Users / Actors

- **开发者**: 后续 Task 的实现者，依赖本任务提供的基础设施

## 5. Behavior Contract

- 依赖安装后 `npm list @tanstack/react-table` 应显示已安装
- 目录结构应符合项目规范
- TypeScript 编译不应因新增文件报错

## 6. Acceptance Criteria

- [ ] `@tanstack/react-table` 安装成功（`npm list` 验证）
- [ ] `src/components/data-table/` 目录创建成功
- [ ] 目录结构符合规范（index.ts + 组件文件 + types.ts）
- [ ] `package.json` 已更新
- [ ] `package-lock.json` 已同步

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 依赖安装成功 | SC-1.1.1: 开发者运行 npm install，@tanstack/react-table 出现在 node_modules | - | - | `npm list @tanstack/react-table` | Completed |
| 目录结构符合规范 | SC-1.1.2: 开发者查看 src/components/data-table/，存在 index.ts 和 types.ts | - | - | `ls -la src/components/data-table/` | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| React 19 兼容性 | 中 | 安装失败或运行时异常 | 安装后运行 `npm run build` 验证 |
| 与现有依赖冲突 | 低 | peer dep 警告 | 检查 `npm install` 输出 |

## 9. Verification Plan

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`
- Manual: 检查 `node_modules/@tanstack/react-table` 存在

## 10. Completion Notes

- Changed source: `package.json`, `package-lock.json`, `src/components/data-table/index.ts`, `src/components/data-table/types.ts`, `src/components/data-table/use-debounce.ts`
- Changed tests: 无
- Verification result: 
  - `npm list @tanstack/react-table`: 已安装 v8.21.3
  - `npx tsc --noEmit`: 通过（无错误）
  - `npm run lint`: 通过（无新增错误）
  - `npm run build`: 通过
  - 目录结构: `src/components/data-table/` 包含 index.ts, types.ts, use-debounce.ts
- Remaining risk: 无
