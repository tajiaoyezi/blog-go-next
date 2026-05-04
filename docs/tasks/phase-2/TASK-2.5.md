# Task 2.5: 自动保存草稿

> **Task ID**: TASK-2.5
> **Phase**: PHASE-2
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: 无

## 1. Background

当前文章编辑页没有自动保存功能，管理员若意外关闭浏览器、刷新页面或遇到网络中断，已编辑的内容可能全部丢失。这在长文写作场景中风险极高。Phase 2 要求实现自动保存草稿机制，保障写作内容安全。

## 2. Goal

实现自动保存草稿功能：每 30 秒自动保存文章表单数据到 localStorage，监听页面关闭事件保存，支持 Ctrl+S 手动保存，页面加载时检测并提示恢复草稿。

## 3. Scope

### In Scope

- 自动保存 Hook（`useAutoSave`）
- 每 30 秒自动保存当前表单数据到 localStorage
- 页面关闭前（`beforeunload`）保存草稿
- `Ctrl+S` / `Cmd+S` 手动保存快捷键
- 页面加载时检测 localStorage 中是否有未提交的草稿
- 草稿恢复提示弹窗（显示保存时间和文章标题）
- 草稿与已发布文章的区分标识
- 草稿清理：成功发布文章后清除对应草稿
- 最多保存 3 篇草稿（防止 localStorage 溢出）

### Out of Scope

- 后端草稿同步（仅本地 localStorage）
- 多设备草稿同步
- 草稿历史版本
- 草稿自动合并（冲突解决）
- 富文本编辑器的撤销栈持久化

## 4. Users / Actors

| 角色 | 使用场景 |
|------|----------|
| 博主/管理员 | 撰写长文时，浏览器意外关闭后恢复内容 |

## 5. Behavior Contract

### 5.1 状态机

```
[编辑中] → 内容发生变化
    ↓ 30 秒计时器到达 / Ctrl+S / beforeunload
[保存中] → 写入 localStorage
    ↓ 保存成功
[已保存] → 显示"草稿已保存 12:34"提示
    ↓ 继续编辑
[编辑中] → 重置计时器

[页面加载]
    ↓ 检测 localStorage 草稿
[有草稿] → 显示恢复提示弹窗
    ↓ 用户点击恢复
[恢复草稿] → 填充表单，清除提示
    ↓ 用户点击丢弃
[丢弃草稿] → 清除 localStorage，继续新建
    ↓ 无草稿
[正常编辑] → 进入编辑中状态
```

### 5.2 草稿数据结构

```typescript
interface Draft {
  id?: number;              // 文章 ID（编辑已有文章时存在）
  title: string;
  content: string;
  categoryId?: number;
  tagNames: string[];
  coverImage?: string;
  isTop: boolean;
  isOriginal: boolean;
  status: number;           // 1=公开, 2=私密
  savedAt: number;          // 保存时间戳
}

// localStorage key: `blog_drafts`
// value: Draft[]（最多 3 条）
```

### 5.3 保存策略

| 触发条件 | 行为 | 防抖/节流 |
|----------|------|-----------|
| 内容变化后 30 秒 | 自动保存 | 防抖（debounce 30s，重置条件：任何字段变化） |
| `Ctrl+S` / `Cmd+S` | 立即保存 | 无（直接触发） |
| `beforeunload` | 同步保存 | 无（同步写入 localStorage） |
| 点击"发布"按钮 | 保存后发布 | 先保存草稿，再调用发布 API |

### 5.4 草稿恢复弹窗

- 弹窗标题："发现未提交的草稿"
- 内容：显示草稿保存时间（"2026-05-03 14:32"）和文章标题
- 按钮："恢复草稿"（primary）、"丢弃草稿"（secondary）
- 仅在有未保存变更的草稿时显示（对比当前表单初始值）

### 5.5 草稿清理规则

- 成功发布文章后：根据文章 ID 清除对应草稿
- 草稿列表超过 3 条时：移除最旧的一条（按 savedAt）
- 草稿保存 30 天后：自动清理（下次加载时检查）

## 6. Acceptance Criteria

- [ ] AC-1: 编辑文章时，30 秒无操作后自动保存草稿到 localStorage
- [ ] AC-2: 自动保存显示 Toast 提示"草稿已保存 14:32"
- [ ] AC-3: 按 Ctrl+S 立即保存草稿，阻止浏览器默认保存行为
- [ ] AC-4: 关闭页面前（beforeunload）同步保存当前草稿
- [ ] AC-5: 页面加载时，检测到未提交的草稿，显示恢复提示弹窗
- [ ] AC-6: 恢复弹窗显示草稿保存时间和文章标题
- [ ] AC-7: 点击"恢复草稿"，表单填充草稿内容，关闭弹窗
- [ ] AC-8: 点击"丢弃草稿"，清除 localStorage 中的草稿，继续新建
- [ ] AC-9: 成功发布文章后，自动清除对应的 localStorage 草稿
- [ ] AC-10: 最多保留 3 条草稿，新草稿覆盖最旧的一条
- [ ] AC-11: 草稿包含所有表单字段（标题、正文、分类、标签、封面、置顶、原创、状态）
- [ ] AC-12: 编辑已有文章时，草稿与新建文章的草稿独立存储

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration/E2E | Verification | Status |
|----------------------|--------------|----------|-----------------|--------------|--------|
| AC-1 | 场景：自动保存触发<br>Given 管理员在编辑文章<br>When 停止输入 30 秒<br>Then localStorage 中写入草稿数据 | `useAutoSave.test.ts`: 模拟内容变化，快进 30 秒，断言 localStorage | E2E: `editor/draft.spec.ts` - 自动保存定时器 | 运行 E2E | Completed |
| AC-2 | 场景：自动保存提示<br>Given 自动保存完成<br>When 保存成功<br>Then 显示 Toast "草稿已保存 14:32" | `useAutoSave.test.ts`: mock Toast，断言调用参数 | E2E: `editor/draft.spec.ts` - Toast 提示验证 | 运行 E2E | Completed |
| AC-3 | 场景：手动保存<br>Given 管理员在编辑文章<br>When 按下 Ctrl+S<br>Then 阻止默认行为<br>And 立即保存草稿 | `useAutoSave.test.ts`: 模拟键盘事件，断言阻止默认和保存逻辑 | E2E: `editor/draft.spec.ts` - 快捷键保存 | 运行 E2E | Completed |
| AC-4 | 场景：关闭前保存<br>Given 有未保存的内容<br>When 触发 beforeunload<br>Then 同步写入 localStorage | `useAutoSave.test.ts`: 模拟 beforeunload，断言同步写入 | E2E: `editor/draft.spec.ts` - 关闭前保存（stub 验证） | 运行 E2E | Completed |
| AC-5 | 场景：恢复提示<br>Given localStorage 有草稿<br>When 打开文章编辑页<br>Then 显示恢复提示弹窗 | `useAutoSave.test.ts`: mock localStorage，断言弹窗显示 | E2E: `editor/draft.spec.ts` - 恢复提示弹窗 | 运行 E2E | Completed |
| AC-6 | 场景：恢复弹窗内容<br>Given 草稿保存时间为 2026-05-03 14:32<br>When 显示弹窗<br>Then 内容包含"2026-05-03 14:32"和文章标题 | `DraftRecoveryDialog.test.tsx`: 渲染测试，断言内容 | E2E: `editor/draft.spec.ts` - 弹窗内容 | 运行 E2E | Completed |
| AC-7 | 场景：恢复草稿<br>Given 恢复弹窗显示<br>When 点击"恢复草稿"<br>Then 表单填充草稿内容<br>And 弹窗关闭 | `useAutoSave.test.ts`: 模拟恢复，断言表单值和弹窗状态 | E2E: `editor/draft.spec.ts` - 恢复操作 | 运行 E2E | Completed |
| AC-8 | 场景：丢弃草稿<br>Given 恢复弹窗显示<br>When 点击"丢弃草稿"<br>Then localStorage 草稿清除<br>And 弹窗关闭 | `useAutoSave.test.ts`: 模拟丢弃，断言 localStorage 清除 | E2E: `editor/draft.spec.ts` - 丢弃操作 | 运行 E2E | Completed |
| AC-9 | 场景：发布后清理<br>Given 表单填写完成<br>When 点击发布且 API 返回成功<br>Then localStorage 中对应草稿被清除 | `useAutoSave.test.ts`: 模拟发布成功，断言草稿清除 | E2E: `editor/draft.spec.ts` - 发布清理 | 运行 E2E | Completed |
| AC-10 | 场景：草稿数量限制<br>Given localStorage 已有 3 条草稿<br>When 新建文章并自动保存<br>Then 最旧的草稿被移除，新草稿加入 | `useAutoSave.test.ts`: mock 3 条草稿，断言覆盖逻辑 | E2E: `editor/draft.spec.ts` - 数量限制 | 运行 E2E | Completed |
| AC-11 | 场景：草稿字段完整<br>Given 所有表单字段已填写<br>When 自动保存触发<br>Then localStorage 草稿包含所有字段 | `useAutoSave.test.ts`: 断言草稿数据结构完整性 | E2E: `editor/draft.spec.ts` - 字段完整性 | 运行 E2E | Completed |
| AC-12 | 场景：编辑与新建草稿隔离<br>Given 正在编辑 ID=5 的文章<br>When 自动保存<br>Then 草稿关联 ID=5，不影响新建文章的草稿 | `useAutoSave.test.ts`: 传入不同 ID，断言草稿隔离 | E2E: `editor/draft.spec.ts` - 草稿隔离 | 运行 E2E | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| localStorage 空间不足（5MB） | 低 | 保存失败 | 限制草稿数量（3条）+ 草稿过期清理（30天） |
| 多标签页同时编辑冲突 | 低 | 草稿互相覆盖 | 使用文章 ID 隔离；最终保存以最后一次为准 |
| 隐私模式 localStorage 不可用 | 低 | 自动保存失效 | 检测可用性，不可用时禁用功能并提示用户 |
| 大量正文内容导致保存卡顿 | 低 | 编辑卡顿 | 防抖处理；异步保存；必要时压缩草稿数据 |

## 9. Verification Plan

### 9.1 单元测试

- **文件**: `frontend/src/hooks/__tests__/useAutoSave.test.ts`
- **文件**: `frontend/src/components/editor/__tests__/DraftRecoveryDialog.test.tsx`
- **覆盖率目标**: 分支覆盖率 ≥ 80%
- **测试重点**: 定时器逻辑、localStorage 读写、弹窗交互、草稿清理

### 9.2 E2E 测试

- **文件**: `frontend/e2e/editor/draft.spec.ts`
- **场景**: 自动保存定时、手动保存、恢复提示、恢复/丢弃操作、发布清理
- **Mock**: 控制时间（Playwright `page.clock`）来测试 30 秒定时器

### 9.3 手动验证

1. 新建文章，输入标题和内容，等待 30 秒，验证 Toast 提示和 localStorage
2. 按 Ctrl+S，验证立即保存提示
3. 刷新页面，验证恢复提示弹窗
4. 点击恢复，验证内容恢复
5. 新建另一篇文章，验证草稿隔离
6. 发布文章，验证草稿清除
7. 在隐私模式下测试，验证 graceful degradation

## 10. Completion Notes

### 实际实现组件/文件路径
- Hook: `frontend/src/hooks/useAutoSave.ts`
- 弹窗组件: `frontend/src/components/editor/DraftRecoveryDialog.tsx`
- localStorage key: `blog_drafts`
- 数据格式: JSON 序列化的 `Draft[]`
- 与表单集成: 在文章编辑页初始化时调用 `useAutoSave(formValues, articleId)`
- 清理策略: 在发布成功回调中调用 `clearDraft(articleId)`
- 隐私模式检测: `try { localStorage.setItem('test', '1') } catch { /* disable */ }`

### 关键决策
- **纯 localStorage 实现，不涉及后端同步**: Phase 2 范围内仅实现本地草稿，多设备同步和版本历史留待后续优化
- **文章 ID 隔离草稿**: 编辑已有文章时草稿关联文章 ID，与新建文章的草稿独立存储，避免互相覆盖
- **防抖保存策略**: 内容变化后 30 秒防抖自动保存，减少 localStorage 写入频率和性能开销

### 遇到的问题及解决方案
- **localStorage 空间不足（5MB）**: 限制草稿数量最多 3 条，草稿保存 30 天后自动清理，防止溢出
- **多标签页同时编辑冲突**: 使用文章 ID 隔离不同文章的草稿，最终保存以最后一次为准，符合用户预期
- **隐私模式 localStorage 不可用**: 通过 try/catch 检测可用性，不可用时禁用自动保存功能并 Toast 提示用户
- **大量正文内容导致保存卡顿**: 使用防抖处理，异步保存，必要时可压缩草稿数据（当前未启用）

### 验证结果
- TypeScript: 0 errors
- ESLint: 0 errors
- Build: success
- 单元测试覆盖率: 分支覆盖率 ≥ 80%

---

**创建日期**: 2026-05-03
**最后更新**: 2026-05-03