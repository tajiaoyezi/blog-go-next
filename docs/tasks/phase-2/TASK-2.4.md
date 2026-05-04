# Task 2.4: 智能标签输入

> **Task ID**: TASK-2.4
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: 无

## 1. Background

当前文章编辑页的标签输入为一个普通文本框，管理员手动输入标签名称，用逗号分隔。这种方式无法利用已有标签、容易拼写错误、无法快速选择常用标签。Phase 2 要求升级为智能标签输入组件，支持自动补全、多选、新建标签。

## 2. Goal

创建 `SmartTagInput` 组件，替换现有标签文本输入框，提供：从已有标签自动补全、多标签选择、新建标签、键盘导航、重复检测，提升标签输入效率和准确性。

## 3. Scope

### In Scope

- `SmartTagInput` 组件（基于 shadcn/ui 的 Command + Badge 组合）
- 自动补全：输入时从已有标签列表实时过滤建议
- 多选：支持选择多个标签，以 Badge 形式展示
- 新建标签：输入不存在的标签名时，提示"创建新标签：xxx"
- 键盘导航：↑↓ 选择建议项，Enter 确认，Backspace 删除最后一个标签
- 重复检测：已选标签不可再次选择
- 标签数量限制：最多 5 个标签
- 标签名称校验：长度 1-20 字符，仅支持中文、英文、数字、连字符、下划线
- 与表单数据双向绑定（受控组件，值格式 `string[]`）

### Out of Scope

- 标签颜色/图标自定义
- 标签分类（父子标签）
- 标签热度排序
- 从文章正文自动提取标签（AI 功能）
- 批量标签管理页面（保持现有标签 CRUD 页面）

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 为文章选择标签，利用已有标签或创建新标签 |

## 5. Behavior Contract

### 5.1 状态机

```
[空闲状态] → 显示输入框和已选标签 Badges
    ↓ 开始输入
[输入中] → 显示下拉建议列表（已有标签匹配项 + 新建提示）
    ↓ 点击建议项 / Enter
[选择标签] → 添加到已选列表，清空输入框，回到空闲状态
    ↓ 点击已选标签的删除按钮 / Backspace
[移除标签] → 从已选列表移除
    ↓ 达到 5 个标签上限
[禁用输入] → 输入框置灰，提示"最多选择 5 个标签"
```

### 5.2 组件接口

```typescript
interface SmartTagInputProps {
  value?: string[];           // 当前已选标签列表
  onChange: (tags: string[]) => void;  // 标签变化回调
  existingTags?: string[];    // 已有标签列表（从后端获取）
  maxTags?: number;           // 最大标签数，默认 5
  disabled?: boolean;         // 禁用状态
  placeholder?: string;       // 占位符文字
}
```

### 5.3 键盘交互

| 按键 | 行为 |
|------|------|
| `↑` / `↓` | 在建议列表中上下移动高亮项 |
| `Enter` | 选择当前高亮项；若无高亮项且输入非空，创建新标签 |
| `Escape` | 关闭建议列表 |
| `Backspace` | 输入框为空时，删除最后一个已选标签 |
| `Tab` | 选择当前高亮项并关闭列表 |
| `,` / `;` | 输入时作为分隔符（自动创建标签） |

### 5.4 自动补全逻辑

- 输入 ≥1 个字符时触发过滤
- 匹配规则：标签名包含输入内容（不区分大小写）
- 建议列表排序：完全匹配 > 开头匹配 > 包含匹配
- 已选标签从建议列表中排除（重复检测）
- 输入内容不在已有标签中时，最后一项显示"创建新标签：{输入内容}"

### 5.5 标签校验规则

| 规则 | 错误提示 |
|------|----------|
| 长度 1-20 字符 | "标签名长度需在 1-20 字符之间" |
| 仅中文、英文、数字、-、_ | "标签名包含非法字符" |
| 不重复 | "标签已存在" |
| 不超过 maxTags | "最多选择 {maxTags} 个标签" |

## 6. Acceptance Criteria

- [ ] AC-1: 组件渲染输入框和已选标签 Badge 列表
- [ ] AC-2: 输入时实时显示匹配的建议列表
- [ ] AC-3: 建议列表按匹配度排序（完全匹配 > 开头匹配 > 包含匹配）
- [ ] AC-4: 已选标签从建议列表中排除，不可重复选择
- [ ] AC-5: 输入不存在的标签名时，显示"创建新标签：xxx"选项
- [ ] AC-6: 点击建议项或按 Enter，将标签添加到已选列表
- [ ] AC-7: 按 Backspace（输入框为空时），删除最后一个已选标签
- [ ] AC-8: 使用 ↑↓ 键盘导航选择建议项，Enter 确认
- [ ] AC-9: 达到 maxTags 限制时，禁用输入并提示
- [ ] AC-10: 输入非法字符时，实时显示校验错误
- [ ] AC-11: 输入逗号或分号自动创建标签
- [ ] AC-12: 点击已选标签的 × 按钮删除该标签
- [ ] AC-13: 传入 value 时正确显示已选标签（编辑模式）
- [ ] AC-14: disabled 时禁用所有交互
- [ ] AC-15: 深色模式下建议列表和 Badge 样式正确

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：组件初始渲染<br>Given 文章编辑页<br>When 页面加载<br>Then 标签输入框和已选区域显示 | `SmartTagInput.test.tsx`: 渲染测试，断言输入框和 Badge 容器存在 | E2E: `editor/tags.spec.ts` - 初始状态 | 运行 E2E | Completed |
| AC-2 | 场景：实时建议列表<br>Given 已有标签 ["Go", "Golang", "GraphQL"]<br>When 输入 "go"<br>Then 显示 "Go", "Golang" 两项建议 | `SmartTagInput.test.tsx`: 模拟输入，断言建议列表内容 | E2E: `editor/tags.spec.ts` - 自动补全 | 运行 E2E | Completed |
| AC-3 | 场景：建议排序<br>Given 输入 "go"<br>When 显示建议列表<br>Then "Go" 排在 "Golang" 前面 | `SmartTagInput.test.tsx`: 断言列表顺序 | E2E: `editor/tags.spec.ts` - 排序验证 | 运行 E2E | Completed |
| AC-4 | 场景：重复检测<br>Given 已选 ["Go"]<br>When 输入 "go"<br>Then 建议列表不包含 "Go" | `SmartTagInput.test.tsx`: 模拟已选状态，断言过滤逻辑 | E2E: `editor/tags.spec.ts` - 重复排除 | 运行 E2E | Completed |
| AC-5 | 场景：新建标签提示<br>Given 已有标签 ["Go"]<br>When 输入 "Rust"<br>Then 最后一项显示"创建新标签：Rust" | `SmartTagInput.test.tsx`: 断言新建提示存在 | E2E: `editor/tags.spec.ts` - 新建提示 | 运行 E2E | Completed |
| AC-6 | 场景：选择标签<br>Given 建议列表显示<br>When 点击 "Go"<br>Then "Go" 添加到已选列表，输入框清空 | `SmartTagInput.test.tsx`: 模拟点击，断言 onChange 和 UI 更新 | E2E: `editor/tags.spec.ts` - 选择操作 | 运行 E2E | Completed |
| AC-7 | 场景：Backspace 删除<br>Given 已选 ["Go", "Rust"]，输入框为空<br>When 按 Backspace<br>Then "Rust" 被移除 | `SmartTagInput.test.tsx`: 模拟 keydown，断言标签列表更新 | E2E: `editor/tags.spec.ts` - Backspace 删除 | 运行 E2E | Completed |
| AC-8 | 场景：键盘导航<br>Given 建议列表打开<br>When 按 ↓<br>Then 第 1 项高亮<br>When 按 Enter<br>Then 选中第 1 项 | `SmartTagInput.test.tsx`: 模拟键盘导航，断言高亮和选择 | E2E: `editor/tags.spec.ts` - 键盘导航 | 运行 E2E | Completed |
| AC-9 | 场景：数量限制<br>Given 已选 5 个标签<br>When 尝试输入第 6 个<br>Then 输入框禁用，显示提示 | `SmartTagInput.test.tsx`: 传入 5 个标签，断言禁用状态 | E2E: `editor/tags.spec.ts` - 数量限制 | 运行 E2E | Completed |
| AC-10 | 场景：非法字符校验<br>Given 输入 "Go@Lang"<br>When 按 Enter<br>Then 显示"标签名包含非法字符" | `SmartTagInput.test.tsx`: 断言校验逻辑 | E2E: `editor/tags.spec.ts` - 字符校验 | 运行 E2E | Completed |
| AC-11 | 场景：分隔符自动创建<br>Given 输入 "Go,Rust"<br>When 输入逗号<br>Then 自动创建 "Go" 标签，输入框保留 "Rust" | `SmartTagInput.test.tsx`: 模拟输入逗号，断言标签创建 | E2E: `editor/tags.spec.ts` - 分隔符创建 | 运行 E2E | Completed |
| AC-12 | 场景：点击删除标签<br>Given 已选 ["Go", "Rust"]<br>When 点击 "Go" 的 × 按钮<br>Then "Go" 被移除 | `SmartTagInput.test.tsx`: 模拟删除按钮点击 | E2E: `editor/tags.spec.ts` - 点击删除 | 运行 E2E | Completed |
| AC-13 | 场景：编辑模式<br>Given value=["Go", "Rust"]<br>When 组件挂载<br>Then 显示两个已选标签 | `SmartTagInput.test.tsx`: 传入 value，断言 Badge 渲染 | E2E: `editor/tags.spec.ts` - 编辑模式 | 运行 E2E | Completed |
| AC-14 | 场景：禁用状态<br>Given disabled=true<br>When 点击输入框<br>Then 不打开建议列表 | `SmartTagInput.test.tsx`: 模拟点击，断言无反应 | E2E: `editor/tags.spec.ts` - 禁用验证 | 运行 E2E | Completed |
| AC-15 | 场景：深色模式<br>Given 深色主题<br>When 打开建议列表<br>Then 列表背景、文字、高亮色正确 | 视觉回归测试 | E2E: `editor/tags.spec.ts` - 深色模式 | 人工检查 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 大量已有标签时性能问题 | 低 | 输入延迟 | 虚拟化建议列表（后续优化）；当前限制显示前 50 条 |
| 中文输入法与 Enter 冲突 | 中 | 误创建标签 | 监听 compositionstart/end，输入法激活时忽略 Enter |
| 后端标签 API 响应慢 | 低 | 建议列表延迟 | 前端缓存已有标签列表；加载文章页时预取 |
| 标签名称大小写不一致 | 低 | 创建重复标签 | 统一存储为小写，显示时首字母大写 |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/components/editor/__tests__/SmartTagInput.test.tsx`
- **文件**: `frontend/src/hooks/__tests__/useTagInput.test.ts`
- **覆盖率目标**: 分支覆盖率 ≥ 80%
- **测试重点**: 过滤排序逻辑、键盘导航、校验规则、状态管理

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/tags.spec.ts`
- **场景**: 自动补全、选择、删除、键盘导航、数量限制、校验错误
- **Mock**: mock 标签列表 API（如有）

### 9.3 手动验证

1. 打开文章编辑页，查看标签输入组件
2. 输入字符，验证建议列表实时显示
3. 点击建议项，验证标签添加到已选列表
4. 输入已选标签名，验证不在建议列表中
5. 输入不存在的标签，验证新建提示
6. 使用 ↑↓ Enter 选择标签
7. 按 Backspace 删除最后一个标签
8. 添加 5 个标签，验证输入框禁用
9. 切换深色模式，验证样式

## 10. Completion Notes

### 实际实现组件/文件路径
- 组件: `frontend/src/components/editor/SmartTagInput.tsx`
- Hook: `frontend/src/hooks/useTagInput.ts`
- 依赖: shadcn/ui 的 `Command`, `Badge`, `Popover` 组件
- 已有标签数据源: 从后端 `GET /api/v1/tags` 获取，或在文章编辑页初始化时注入
- 表单集成: 值格式为 `string[]`，直接绑定到 React Hook Form
- 样式: 使用 Tailwind CSS，建议列表使用 Popover 定位
- i18n: 提示文字使用 `editor.tags.*` 命名空间

### 关键决策
- **基于 shadcn/ui Command + Badge 组合**: 利用现有 UI 库组件，保持设计一致性，减少自定义样式工作量
- **统一存储小写，显示首字母大写**: 避免大小写不一致导致创建重复标签，同时保证 UI 显示美观
- **建议列表限制 50 条**: 防止大量标签时输入延迟，后续可优化为虚拟化列表

### 遇到的问题及解决方案
- **中文输入法与 Enter 冲突**: 监听 `compositionstart`/`compositionend` 事件，输入法激活时忽略 Enter，避免误创建标签
- **大量已有标签时性能问题**: 限制建议列表显示前 50 条，前端缓存标签列表，避免每次输入都过滤全量数据
- **标签名称大小写不一致**: 统一存储为小写，显示时首字母大写，从源头避免重复标签创建

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- 单元测试覆盖率: 分支覆盖率 ≥ 80%

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03