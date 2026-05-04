# S2V Development｜规格到验证驱动开发规范

> **Spec-to-Verification Development Standard**
> 面向任意软件项目的通用开发协议。
> 不绑定语言、技术栈、工具链或目录约定。每个项目通过「项目适配层」声明实际路径、命令与约束。
>
> 同步 Skill 入口：`~/.claude/skills/s2v-development/`（精简执行核心 + 完整规范副本）。

---

## 1. 规范定位

S2V Development 定义一套可复用的项目开发方法，而不是某个项目的目录模板、技术栈模板或工具链模板。

名称含义：

- **S**pec —— 起点是可判定的规格（SDD 层）。
- **to** —— 过程是把规格逐层转译为业务可读的场景（BDD 层）和可执行的测试（TDD 层）。
- **V**erification —— 终点是真实使用路径的验证（Integration / E2E / Runtime 层）。

它解决的问题：在 AI 辅助开发和 vibecoding 过程中，如何避免「直接开写、需求漂移、验收缺失、测试滞后、文档与实现脱节」。

本规范只规定：

- 工作流。
- 产物之间的关系。
- 质量门禁。
- 追踪机制。

本规范不规定：

- 用什么语言、框架、测试工具。
- 项目目录如何命名。
- 命令长什么样。

每个项目必须通过「项目适配层」（见 §4）声明这些项目特有信息。规范本身永远保持干净。

---

## 2. 核心目标

1. 用 SDD 明确需求、边界、约束和验收。
2. 用 BDD 把需求转成业务或用户可理解的场景。
3. 用 TDD 把关键行为转成可执行测试，再驱动实现。
4. 用集成、E2E、运行时验证确认真实使用路径。
5. 用追踪表把需求、场景、测试、实现和验证结果绑定起来。
6. 用固定门禁约束人和 AI agent 的执行顺序。
7. 让每次开发都有可恢复的上下文、可审查的证据和可复用的记录。

---

## 3. 适用范围

### 3.1 适合完整套用

- 新功能开发。
- Bug 修复。
- 重构。
- UI / UX 优化。
- API 或协议变更。
- 数据模型或持久化变更。
- 数据处理流程。
- 自动化脚本。
- 基础设施变更。
- 测试体系建设。
- 依赖或工具链变更。
- 架构演进。

### 3.2 不适合完整套用

- 一次性临时实验。
- 纯文本错别字修正。
- 无行为变化的格式化或重排。
- 明确不进入主线的探索代码。

这类场景可以走轻量流程（见 §15.4），但仍需说明范围、变更和验证方式。

---

## 4. 项目适配层

### 4.1 适配层的作用

通用规范不能假设固定路径，也不能假设固定工具。每个项目必须维护一份适配层，告诉本规范的执行方（人或 AI agent）：

- 项目用什么命名规范放规格、场景、决策、源码、测试。
- 项目用什么命令做 lint、类型检查、各级测试、构建、运行时 smoke。
- 项目有哪些语言、平台、安全、性能、合规、发布约束。

适配层让通用规范不被项目细节污染，也让 AI agent 一进项目就能拿到所有上下文，不必猜。

> 本规范中存在两类占位符：
>
> 1. **适配层占位符**（如 `<PROJECT_NAME>`、`<SPEC_HOME>`、`<UNIT_TEST_COMMANDS>`）：项目级配置，必须在适配层中声明实际值。
> 2. **模板填空占位符**（如 `<MAIN_FLOW>`、`<ACTOR>`、`<ACCEPTANCE_CRITERION>`）：模板内部按位填写的字段，由产物作者根据当下任务填入具体内容，无需写入适配层。

### 4.2 适配层必须声明的内容

| 配置项 | 含义 |
|---|---|
| `<PROJECT_NAME>` | 项目名称 |
| `<PROJECT_TYPE>` | 项目类型（如 Web、API、CLI、Mobile、Desktop、Data Pipeline、Infrastructure 等） |
| `<USER_ROLES>` | 主要使用者或调用方 |
| `<CRITICAL_WORKFLOWS>` | 核心业务或系统流程 |
| `<SPEC_HOME>` | SDD 产物所在位置 |
| `<MASTER_SPEC>` | 项目总规格入口 |
| `<PHASE_SPEC_PATTERN>` | 阶段规格命名或组织方式 |
| `<TASK_SPEC_PATTERN>` | 单任务规格命名或组织方式 |
| `<ACCEPTANCE_HOME>` | BDD 场景所在位置 |
| `<DECISION_HOME>` | ADR 或决策记录所在位置 |
| `<SOURCE_AREAS>` | 主要源码区域 |
| `<UNIT_TEST_AREAS>` | 单元测试所在区域 |
| `<INTEGRATION_TEST_AREAS>` | 集成测试所在区域 |
| `<E2E_TEST_AREAS>` | 端到端测试所在区域 |
| `<LINT_COMMANDS>` | 静态检查命令 |
| `<TYPECHECK_COMMANDS>` | 类型检查命令（如有） |
| `<UNIT_TEST_COMMANDS>` | 单元测试命令 |
| `<INTEGRATION_TEST_COMMANDS>` | 集成测试命令 |
| `<E2E_TEST_COMMANDS>` | 端到端测试命令 |
| `<BUILD_COMMANDS>` | 构建命令 |
| `<RUNTIME_SMOKE_COMMANDS>` | 运行时 smoke 验证命令 |
| `<RELEASE_OR_DEPLOY_COMMANDS>` | 发布或部署命令 |
| `<RUNTIME_TARGET>` | 运行时目标（如目标 OS、运行时版本、容器、编排平台） |
| `<SUPPORTED_PLATFORMS>` | 目标平台与版本范围 |
| `<SECURITY_REQUIREMENTS>` | 鉴权、权限、加密、合规约束 |
| `<PERFORMANCE_REQUIREMENTS>` | 延迟、吞吐、资源约束 |
| `<COMPATIBILITY_REQUIREMENTS>` | 向前 / 向后兼容性约束 |
| `<RELEASE_CONSTRAINTS>` | 发布窗口、灰度、回滚约束 |

未使用的条目可以留空，但不得删除字段，以免后续 agent 误以为「该项无要求」。

### 4.3 适配层模板

```markdown
# Project Development Adapter

## Project

- Name: `<PROJECT_NAME>`
- Type: `<PROJECT_TYPE>`
- Primary users / actors: `<USER_ROLES>`
- Critical workflows: `<CRITICAL_WORKFLOWS>`

## Specification Locations

- SDD home: `<SPEC_HOME>`
- Master spec: `<MASTER_SPEC>`
- Phase spec pattern: `<PHASE_SPEC_PATTERN>`
- Task spec pattern: `<TASK_SPEC_PATTERN>`
- BDD acceptance home: `<ACCEPTANCE_HOME>`
- ADR home: `<DECISION_HOME>`

## Source And Test Areas

- Source areas: `<SOURCE_AREAS>`
- Unit test areas: `<UNIT_TEST_AREAS>`
- Integration test areas: `<INTEGRATION_TEST_AREAS>`
- E2E test areas: `<E2E_TEST_AREAS>`

## Commands

- Lint: `<LINT_COMMANDS>`
- Typecheck: `<TYPECHECK_COMMANDS>`
- Unit tests: `<UNIT_TEST_COMMANDS>`
- Integration tests: `<INTEGRATION_TEST_COMMANDS>`
- E2E tests: `<E2E_TEST_COMMANDS>`
- Build: `<BUILD_COMMANDS>`
- Runtime smoke: `<RUNTIME_SMOKE_COMMANDS>`
- Release / Deploy: `<RELEASE_OR_DEPLOY_COMMANDS>`

## Constraints

- Runtime target: `<RUNTIME_TARGET>`
- Supported platforms: `<SUPPORTED_PLATFORMS>`
- Security requirements: `<SECURITY_REQUIREMENTS>`
- Performance requirements: `<PERFORMANCE_REQUIREMENTS>`
- Compatibility requirements: `<COMPATIBILITY_REQUIREMENTS>`
- Release constraints: `<RELEASE_CONSTRAINTS>`
```

适配层放在哪个文件、哪个目录由项目决定，规范不强制。常见做法是在项目入口文档中维护一份独立适配层文件并引用。

### 4.4 适配层使用规则

- 项目专属路径、命令、工具链永远写在适配层，不写进通用规范。
- 适配层是 agent 进入项目的「第一份必读文件」。
- 适配层一旦变化（如新增测试命令、迁移规格目录），立即更新；不允许长期落后于真实状态。
- 同一项目只维护一份适配层；多团队 / 多分支差异通过适配层内分节体现。

---

## 5. 分层模型

| 层级 | 解决的问题 | 主要产物 | 成功标准 |
|---|---|---|---|
| SDD | 做什么、为什么做、边界在哪里 | Master Spec、Phase Spec、Task Spec | 范围清楚，验收标准可判定 |
| BDD | 用户或业务如何感知结果 | Feature 文件、Scenario、验收场景表 | 场景可读，覆盖主流程、异常流、边界流 |
| TDD | 代码行为是否正确 | 单元测试、组件测试、服务测试、模块测试 | 关键行为先有失败测试或明确豁免 |
| Integration | 模块之间是否协作正确 | 集成测试、契约测试、API 测试 | 跨边界行为可验证 |
| E2E / Runtime | 真实使用路径是否成立 | 端到端测试、运行时 smoke、手工验收记录 | 用户路径或系统路径可证实 |
| ADR | 为什么做这个技术决策 | 决策记录 | 背景、选择、替代方案、影响可追溯 |

> 表中产物是测试**类型**或文档**角色**，不是具体工具。具体工具由适配层声明。

---

## 6. 基本原则

### 6.1 单一事实源

每个功能、修复或重构都必须有一个 SDD 入口作为事实源。实现过程中发现需求变化，必须先更新 SDD，再同步 BDD、测试和实现。

禁止让聊天记录、临时注释、口头约定或未归档的 TODO 成为长期事实源。

### 6.2 先契约，后实现

非平凡改动进入实现前，必须明确：

1. 目标。
2. 范围。
3. 非范围。
4. 验收标准。
5. 测试策略。
6. 风险。
7. 验证方式。

没有可判定的验收标准时，不进入实现。

### 6.3 测试与风险匹配

测试强度由风险决定，不由目录或代码量决定。

高风险改动需要更多验证：

- 影响核心流程。
- 影响数据一致性。
- 影响鉴权、权限、安全。
- 影响支付、计费、生产数据、用户隐私。
- 涉及并发、缓存、异步任务、外部系统。
- 改变公共 API、协议或持久化结构。

低风险改动可以走轻量验证（见 §15.4），但不能没有验证说明。

### 6.4 不强绑工具链

本规范不规定必须使用某个测试框架、语言、构建工具或目录结构。

项目可以使用任何合适工具，但必须在适配层声明：

- 用什么工具。
- 命令是什么。
- 哪些测试覆盖哪些风险。
- 无法自动化的部分如何验证。

### 6.5 渐进落地

不要求一次性引入全部测试层级。允许按 SDD → BDD → TDD → Integration → E2E 的顺序分阶段引入，但每个新增层级都必须在适配层登记，并在 Task Spec 的追踪表中体现。

---

## 7. 标准开发生命周期

```text
Idea
  -> SDD
  -> BDD
  -> Test Strategy
  -> TDD Red
  -> Implementation Green
  -> Refactor
  -> Integration / E2E / Runtime Verification
  -> Documentation Backfill
  -> Review
  -> Merge / Release
```

### 7.1 阶段门禁

| 阶段 | 进入条件 | 退出条件 |
|---|---|---|
| Idea | 出现需求、问题或改动意图 | 目标、优先级、范围初步明确 |
| SDD | 可以描述问题和价值 | Task Spec 完成，验收标准可判定 |
| BDD | 有用户路径、业务流程或外部可见行为 | 主流程、异常流、边界场景完成 |
| Test Strategy | 已知影响面 | 单元 / 集成 / E2E / 手工验证的选择已记录 |
| TDD Red | 关键行为可测试 | 失败测试存在，或记录豁免 |
| Implementation Green | 有测试或验收策略 | 最小实现完成，相关测试通过 |
| Refactor | 行为已受测试保护 | 结构优化完成，测试仍通过 |
| Verification | 功能可运行 | 自动化或手工验证有结果 |
| Backfill | 实现和验证完成 | SDD、BDD、追踪表、ADR 更新 |
| Review | 产物完整 | 发现项处理，剩余风险明确 |

---

## 8. SDD 规范

### 8.1 Master Spec

Master Spec 是项目总入口，描述项目级事实。

必须包含：

1. 背景。
2. 目标。
3. 范围和非范围。
4. 用户或使用者。
5. 核心流程。
6. 技术约束。
7. 质量标准。
8. 风险登记册。
9. 阶段规划。
10. 决策记录索引。

存放位置由适配层 `<MASTER_SPEC>` 指定。

### 8.2 Phase Spec

Phase Spec 描述一个阶段或里程碑。

必须包含：

1. 阶段目标。
2. 业务价值。
3. 涉及模块。
4. 任务清单。
5. 依赖关系。
6. 阶段级验收标准。
7. 阶段级风险。
8. 阶段级 Definition of Done。

命名与组织方式由适配层 `<PHASE_SPEC_PATTERN>` 指定。

### 8.3 Task Spec

Task Spec 是最小执行单元。简单任务可以写在 Phase Spec 内；复杂任务必须拆为单独文件。

模板：

````markdown
# Task `<TASK_ID>`: `<TASK_NAME>`

**Status**: Not Started | In Progress | Blocked | Done
**Priority**: P0 | P1 | P2 | P3
**Owner**: `<OWNER>`
**Related Phase**: `<PHASE_ID>`
**Dependencies**: `<DEPENDENCIES>`

## 1. Background

为什么需要这次改动。

## 2. Goal

任务完成后应该成立的事实。

## 3. Scope

### In Scope

- ...

### Out Of Scope

- ...

## 4. Users / Actors

- `<ACTOR>`：`<HOW_THEY_INTERACT>`

## 5. Behavior Contract

描述外部可观察行为、API 契约、数据契约或系统契约。

## 6. Acceptance Criteria

- [ ] `<ACCEPTANCE_CRITERION_1>`
- [ ] `<ACCEPTANCE_CRITERION_2>`

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| `<CRITERION>` | `<SCENARIO_ID>` | `<TEST_ID>` | `<FLOW_TEST_ID>` | `<COMMAND_OR_MANUAL_CHECK>` | Not Started |

## 8. Risks

- ...

## 9. Verification Plan

- Lint: `<LINT_COMMANDS>`
- Typecheck: `<TYPECHECK_COMMANDS>`
- Unit: `<UNIT_TEST_COMMANDS>`
- Integration: `<INTEGRATION_TEST_COMMANDS>`
- E2E: `<E2E_TEST_COMMANDS>`
- Runtime smoke: `<RUNTIME_SMOKE_COMMANDS>`
- Manual: `<MANUAL_VERIFICATION_STEPS>`

## 10. Completion Notes

- Changed source: `<SOURCE_PATHS>`
- Changed tests: `<TEST_PATHS>`
- Verification result: `<RESULT>`
- Remaining risk: `<RISK>`
````

### 8.4 SDD 编写规则

SDD 应该写：

- 用户价值。
- 可观察行为。
- 输入输出契约。
- 数据约束。
- 权限和安全约束。
- 性能和兼容性要求。
- 明确不做什么。
- 验证方式。

SDD 不应该写：

- 未确认的具体实现路径。
- 随意承诺的依赖。
- 不能判定的验收标准。
- 无 owner 的 TODO。
- 没有边界的「优化」「增强」「完善」。
- 项目专属硬编码路径或命令（这些只能进适配层）。

---

## 9. BDD 规范

### 9.1 BDD 的定位

BDD 用业务或用户语言描述外部可感知的行为。它关心「外部如何感知系统」，不关心内部如何实现。

适用场景：

- 用户界面流程。
- API 使用流程。
- CLI 命令流程。
- 数据处理流程。
- 异步任务流程。
- 权限和错误流程。
- 跨系统交互流程。

### 9.2 轻量 BDD

`.feature` 文件可以作为业务可读的场景文档，是否引入 step definitions 由项目自行决定：

- 轻量项目可以只把 `.feature` 当文档，不绑定执行框架，由对应的执行测试在追踪表中引用 Scenario ID 即可。
- 需要严格自动化的项目可以引入 step definitions 工具链，让 `.feature` 直接驱动执行。

无论选择哪种方式，每个 BDD 场景都必须能在追踪表中映射到一种验证方式。

### 9.3 Scenario 模板

```gherkin
Feature: `<FEATURE_NAME>`
  In order to `<BUSINESS_VALUE>`
  As a `<ACTOR>`
  I want `<CAPABILITY>`

  Background:
    Given `<COMMON_PRECONDITION>`

  Scenario: `<MAIN_FLOW>`
    Given `<STATE>`
    When `<ACTION>`
    Then `<OBSERVABLE_RESULT>`

  Scenario: `<ERROR_FLOW>`
    Given `<ERROR_PRECONDITION>`
    When `<ACTION>`
    Then `<ERROR_OR_PROTECTION_RESULT>`

  Scenario: `<BOUNDARY_FLOW>`
    Given `<BOUNDARY_STATE>`
    When `<ACTION>`
    Then `<EXPECTED_BOUNDARY_RESULT>`
```

存放位置由适配层 `<ACCEPTANCE_HOME>` 指定。

### 9.4 BDD 编写规则

BDD 应该：

- 使用业务语言。
- 描述角色、动作和结果。
- 覆盖主流程、异常流、边界流。
- 说明前置条件。
- 能映射到自动化或手工验收。

BDD 不应该：

- 依赖具体 UI selector。
- 暴露内部函数名。
- 复制实现逻辑。
- 把测试数据准备细节写成业务规则。
- 写成单纯的技术 checklist。

### 9.5 BDD 到执行测试的映射

每个重要 BDD 场景必须在追踪表中映射到一种验证方式：

- 单元测试。
- 集成测试。
- 端到端测试。
- 契约测试。
- 运行时 smoke。
- 手工验收。
- 明确豁免。

不能自动化的场景必须按 §12.3 写明豁免原因和替代验证方式。

---

## 10. TDD 规范

### 10.1 TDD 的定位

TDD 用来锁定关键代码行为。它不是覆盖率表演，也不是 E2E 的替代品。

TDD 优先覆盖：

- 纯逻辑。
- 数据转换。
- 状态机。
- 权限判断。
- 输入校验。
- 错误处理。
- 边界条件。
- 并发控制。
- 缓存策略。
- 协议解析。
- 业务规则。

### 10.2 Red-Green-Refactor

每个 TDD 循环包含：

1. **Red**：写一个会失败的测试，证明当前行为缺失或错误。
2. **Green**：写最小实现让测试通过。
3. **Refactor**：在测试保护下改善结构。

### 10.3 测试粒度选择

| 目标 | 推荐测试 |
|---|---|
| 纯函数行为 | 单元测试 |
| 状态流转 | 单元测试或模块测试 |
| UI 组件行为 | 组件测试或交互测试 |
| API 合约 | 契约测试或集成测试 |
| 数据库读写 | 集成测试 |
| 跨服务流程 | 集成测试或 E2E |
| CLI 行为 | 命令级测试或输出回归测试 |
| 桌面或移动端流程 | UI 自动化或手工验收记录 |
| 基础设施变更 | plan / dry-run / smoke 验证 |
| 数据任务 | 输入输出样本测试和回归数据集 |

> 表中列出的是测试**类型**而非测试**工具**。具体工具由适配层 `<UNIT_TEST_COMMANDS>` 等条目声明，本规范不规定具体框架。

### 10.4 允许的例外

- 遗留系统没有测试入口。
- 外部系统难以模拟。
- UI、硬件或运行时交互暂时无法自动化。
- 现有工具链不支持。

例外必须在追踪表中以「Waived」状态记录，并按 §12.3 写明替代验证方式。

### 10.5 TDD 禁止事项

禁止：

- 先写完整实现，再补弱断言测试。
- 为了通过测试删除关键断言。
- 只测试 happy path。
- 静默吞错误。
- 用 mock 掩盖真实契约变化。
- 把不稳定测试留在主线且没有隔离策略。

---

## 11. 集成、E2E 和运行时验证

### 11.1 目的

单元测试证明局部行为，集成与 E2E 验证真实协作路径。

需要额外验证的情况：

- 多模块协作。
- 用户界面流程。
- API 调用链。
- 数据库、缓存、队列、文件系统、外部服务。
- 权限和鉴权。
- 构建、启动、安装、升级。
- 桌面、移动端、浏览器、硬件或运行时交互。

### 11.2 验证类型

| 类型 | 适用场景 |
|---|---|
| Integration Test | 模块之间有真实依赖 |
| Contract Test | API、协议、事件格式、SDK 对外契约 |
| E2E Test | 用户路径或系统路径 |
| Runtime Smoke | 启动、连接、基础操作可用 |
| Manual Verification | 暂时无法自动化但必须验证 |
| Dry Run / Plan | 基础设施、数据迁移、批处理任务 |

具体执行方式由适配层 `<INTEGRATION_TEST_COMMANDS>`、`<E2E_TEST_COMMANDS>`、`<RUNTIME_SMOKE_COMMANDS>` 等条目声明。

### 11.3 验证记录

每次完成必须记录：

1. 运行了什么命令。
2. 结果是什么。
3. 没有运行什么。
4. 为什么没有运行。
5. 替代检查是什么。
6. 剩余风险是什么。

记录写在 Task Spec 的「Completion Notes」或交付说明（见 §19）中。

---

## 12. 追踪机制

### 12.1 追踪表

追踪表是 SDD、BDD、TDD 与实现之间的核心连接。

```markdown
| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| `<CRITERION>` | `<SCENARIO_ID>` | `<TEST_ID>` | `<FLOW_TEST_ID>` | `<COMMAND_OR_MANUAL_CHECK>` | Not Started |
```

每个 Task Spec 都必须维护一份追踪表。验收标准没有对应行的，视为未规划。

### 12.2 状态枚举

| 状态 | 含义 |
|---|---|
| Not Started | 已定义但未开始 |
| Spec Ready | SDD 已完成 |
| Scenario Ready | BDD 已完成 |
| Test Red | 失败测试已存在 |
| In Progress | 实现中 |
| Verified | 自动或手工验证通过 |
| Waived | 有明确豁免 |
| Blocked | 存在阻塞 |
| Done | 完成且已回写 |

### 12.3 豁免规则

任何测试或验证豁免必须写清：

1. 豁免对象。
2. 豁免原因。
3. 替代验证。
4. 补齐条件。
5. 负责人或触发条件。

无说明的豁免视为风险，Review 时必须打回。

---

## 13. Definition of Ready

任务进入实现前必须满足：

- [ ] 目标明确。
- [ ] 范围明确。
- [ ] 非范围明确。
- [ ] 验收标准可判定。
- [ ] 关键用户、调用方或系统 actor 已明确。
- [ ] 影响面已初步识别。
- [ ] 测试策略已明确。
- [ ] 依赖和风险已记录。
- [ ] 项目适配层能告诉 agent 应该用哪些路径和命令。

不满足时，应先补规格或更新适配层，不应直接实现。

---

## 14. Definition of Done

任务完成必须满足：

- [ ] SDD 状态已更新。
- [ ] 验收标准已逐项确认。
- [ ] BDD 场景已新增、更新或明确不需要。
- [ ] TDD 测试已新增、更新或记录豁免。
- [ ] 集成、E2E 或运行时验证已完成或记录豁免。
- [ ] 适配层声明的相关命令已运行，或说明不能运行的原因。
- [ ] 错误路径已处理。
- [ ] 边界条件已处理。
- [ ] 用户可见行为或系统外部行为符合验收。
- [ ] 文档、测试和实现没有明显冲突。
- [ ] 没有无 owner 的 TODO、临时 mock、placeholder 留在主线。
- [ ] 剩余风险已记录。

---

## 15. AI Vibecoding 执行协议

### 15.1 每次任务开始时

AI agent 必须：

1. 读取项目适配层。
2. 找到或创建对应 SDD task。
3. 收集相关源码、测试、文档与命令上下文。
4. 明确本次范围与非范围。
5. 识别需要新增或更新的 BDD、TDD、集成、E2E 产物。
6. 给出简短执行计划。

### 15.2 实现前必须回答

1. 这次改动对应哪个 SDD task？
2. 谁会感知这个变化？
3. 主流程是什么？
4. 异常流程是什么？
5. 边界条件是什么？
6. 哪些行为需要 TDD？
7. 哪些路径需要集成或 E2E？
8. 完成后要回写哪些产物？

### 15.3 AI agent 禁止事项

禁止：

- 未读现有上下文就生成新结构。
- 没有验收标准就直接实现。
- 把项目专属目录或命令硬编码进通用规范。
- 在适配层之外写项目特有的路径假设。
- 修改与本次任务无关的文件。
- 静默吞错误。
- 用「应该可以」替代验证证据。
- 留下无主 TODO、临时 mock、placeholder。
- 把无法运行的验证说成已通过。

### 15.4 轻量流程

低风险任务可以走轻量流程：

1. 明确范围。
2. 修改。
3. 运行最小相关验证。
4. 汇报结果与剩余风险。

适用：文案修正、样式微调、单文件 bug 修复、明确的测试修复、文档格式修正。

低风险不等于无验证。轻量流程仍需说明跑了什么、剩余什么风险。

---

## 16. ADR 规范

### 16.1 何时必须写 ADR

- 引入或替换核心依赖。
- 改变架构边界。
- 改变数据模型或持久化方式。
- 改变 API、协议、事件格式。
- 改变鉴权、权限、安全策略。
- 改变测试工具链。
- 改变发布、部署、运行时模式。
- 做不可轻易回滚的技术决策。

### 16.2 ADR 模板

```markdown
# ADR `<ADR_ID>`: `<TITLE>`

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: `<DATE>`

## Context

## Decision

## Rationale

## Alternatives

## Consequences

## Rollback Or Migration Plan

## Follow-ups
```

存放位置由适配层 `<DECISION_HOME>` 指定。

---

## 17. 变更类型流程

### 17.1 新功能

完整走：

1. SDD。
2. BDD。
3. 测试策略。
4. TDD。
5. 实现。
6. 集成或 E2E。
7. 回写追踪表。

### 17.2 Bug 修复

必须先复现：

1. 在 Task Spec 中记录问题。
2. 写失败测试或可复现步骤。
3. 修复。
4. 验证不回归。
5. 回写完成记录。

### 17.3 重构

必须满足：

1. 用户可见行为或外部契约不变。
2. 先确认测试保护。
3. 测试不足时先补测试或记录风险。
4. 重构后运行相关验证。

### 17.4 UI / UX 改动

至少考虑：

1. 默认状态。
2. 加载状态。
3. 空状态。
4. 错误状态。
5. 禁用状态。
6. 权限状态。
7. 响应式或平台差异。
8. 可访问性。

### 17.5 API / 协议改动

必须考虑：

1. 兼容性。
2. 调用方影响。
3. 错误码或错误结构。
4. 版本策略。
5. 契约测试。
6. 迁移计划。

### 17.6 数据或迁移改动

必须考虑：

1. 数据备份。
2. 回滚策略。
3. 幂等性。
4. dry-run。
5. 小样本验证。
6. 生产风险。

### 17.7 依赖或工具链改动

必须考虑：

1. 为什么需要。
2. 替代方案。
3. 兼容性。
4. lockfile 或版本锁定。
5. CI 影响。
6. 本地开发影响。
7. 回滚方式。

核心依赖或工具链变更必须同步写 ADR，并更新适配层中相关命令与约束。

---

## 18. Review 标准

Review 优先看行为和风险，不只看代码风格。

检查顺序：

1. 是否有对应 SDD。
2. 验收标准是否被满足。
3. BDD 场景是否覆盖真实流程。
4. 测试是否能发现实际回归。
5. 错误和边界是否处理。
6. 是否有未声明的架构或依赖变化。
7. 是否有无关重构。
8. 验证证据是否可信。
9. 文档、测试和实现是否一致。
10. 剩余风险是否记录。

---

## 19. 交付说明模板

适用于 commit 描述、PR 描述、release notes 或任意需要总结一次交付的场合。

```markdown
## Summary

- ...

## SDD

- Task: `<TASK_ID>`
- Acceptance criteria updated: `<COUNT_OR_LIST>`

## BDD / TDD / Verification

- BDD: `<SCENARIO_IDS>`
- TDD: `<TEST_IDS>`
- Integration / E2E: `<FLOW_TEST_IDS>`
- Manual: `<MANUAL_STEPS>`

## Commands

- `<COMMAND>`: passed | failed | not run（附原因）

## Changed Areas

- Specs: `<SPEC_PATHS>`
- Source: `<SOURCE_PATHS>`
- Tests: `<TEST_PATHS>`
- ADR: `<ADR_PATHS>`

## Risks

- ...

## Follow-ups

- ...
```

---

## 20. 新项目落地步骤

新项目从零接入本规范，按以下顺序落地：

1. 创建或指定项目适配层。
2. 在适配层声明 SDD、BDD、测试、ADR 的实际位置。
3. 在适配层声明 lint、typecheck、各级测试、build、runtime smoke 命令。
4. 建立 Master Spec。
5. 为第一个真实任务写 Task Spec。
6. 为该任务写至少一个 BDD 场景。
7. 为关键行为写 TDD 测试或在追踪表中记录豁免。
8. 实现任务。
9. 运行适配层声明的相关验证。
10. 回写追踪表与 Completion Notes。
11. 在 Review 中检查规范是否真的被执行。

---

## 21. 最终执行口径

以后使用本规范进行 vibecoding，默认口径如下：

1. 没有项目适配层，先建立适配层。
2. 没有 SDD，不进入实现。
3. 没有可判定的验收标准，不进入实现。
4. 有用户或外部系统可见行为，就写 BDD。
5. 有关键逻辑，就写 TDD。
6. 有跨模块或真实运行路径，就做集成、E2E 或 runtime smoke。
7. 有架构、依赖、协议、安全或数据决策，就写 ADR。
8. 完成后必须回写追踪表与 Completion Notes。
9. 不能验证时必须说明原因、替代检查与剩余风险。
10. 项目专属路径、命令、工具链永远由项目适配层决定，不写进通用规范。

本规范的目的不是增加流程负担，而是让 AI 辅助开发从「凭上下文猜测」变成「按契约执行、按证据交付、按记录演进」。
