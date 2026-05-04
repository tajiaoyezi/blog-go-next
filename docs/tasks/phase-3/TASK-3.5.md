# Task 3.5: 全局搜索（可选增强）

> **Task ID**: TASK-3.5
> **Phase**: PHASE-3
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: TASK-3.4
> **Estimated Effort**: 1 天
> **Actual Effort**: ~1h

---

## 1. Background

当前管理后台缺乏全局搜索能力，管理员需要通过导航菜单逐级查找功能和内容。参考 Halo 2.x Console 的 Command Palette 设计，全局搜索能够大幅提升操作效率，支持 Cmd+K 快速唤起、搜索文章/评论、快捷操作等功能。

⚠️ **注意**: 本任务标记为"可选增强"，若工期紧张可降级为仅实现 Cmd+K 快捷导航，不做后端搜索。

## 2. Goal

实现 Halo 风格的全局搜索面板，支持 Cmd+K 唤起、搜索文章和评论、快捷操作入口、键盘导航，使管理员能够快速定位内容和功能。

## 3. Scope

### 3.1 In Scope

- **唤起方式**: Cmd+K / Ctrl+K 全局快捷键
- **搜索内容**:
  - 文章：按标题搜索，点击跳转编辑
  - 评论：按内容搜索，点击跳转详情
  - 页面：快捷跳转到管理后台各页面
- **快捷操作**: "写文章"、"查看评论"、"站点设置"等固定入口
- **最近访问**: 显示最近访问的 5 个页面（localStorage 存储）
- **键盘导航**: ↑↓ 选择，Enter 确认，Esc 关闭
- **空搜索**: 显示最近访问 + 快捷操作

### 3.2 Out of Scope

- 后端全文搜索（使用现有 API，前端过滤）
- 搜索结果高亮
- 搜索历史持久化（仅最近访问）
- 多语言搜索
- 搜索建议（自动补全）

## 4. Users / Actors

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 日常使用管理后台 | 快速定位文章、评论、功能页面 |

## 5. Behavior Contract

### 5.1 组件接口

```typescript
// src/components/command-palette.tsx

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: 'article' | 'comment' | 'page' | 'action' | 'recent';
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;           // 跳转链接（与 onSelect 二选一）
  onSelect?: () => void;   // 自定义选择行为
}

interface CommandPaletteState {
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  recentItems: SearchResult[];
}
```

### 5.2 交互流程

```
[用户按下 Cmd+K]
    ↓
[显示搜索面板（遮罩层 + 居中弹窗）]
    ↓
[输入框聚焦，显示最近访问 + 快捷操作]
    ↓
[用户输入关键词]
    ↓
[防抖 300ms 后触发搜索]
    ↓
[结果按类型分组：文章 / 评论 / 页面 / 快捷操作]
    ↓
[用户按 ↑↓ 选择，Enter 确认，Esc 关闭]
```

### 5.3 视觉规范

- 面板：
  - 宽度：`max-w-2xl w-full`
  - 背景：`bg-popover`
  - 圆角：`rounded-xl`
  - 阴影：`shadow-2xl`
  - 位置：固定居中，顶部 `top-[20vh]`
- 输入框：
  - 高度：`h-14`
  - 边框：底部 `border-b`
  - 占位符："搜索文章、评论或输入命令..."
  - 左侧：搜索图标
  - 右侧：Esc 关闭提示
- 结果列表：
  - 分组标题：`text-xs font-medium text-muted-foreground uppercase`
  - 结果项：高度 `h-10`，hover `bg-accent`
  - 选中项：`bg-accent` + 左侧边框指示
  - 图标：`w-4 h-4 text-muted-foreground`
- 遮罩层：`bg-black/50`，点击关闭

### 5.4 搜索逻辑

```typescript
// 搜索策略
function search(query: string): SearchResult[] {
  if (!query.trim()) {
    return [...recentItems, ...quickActions];
  }
  
  const results: SearchResult[] = [];
  
  // 1. 搜索文章（前端过滤，最多 5 条）
  const articles = filterArticles(query);
  if (articles.length) {
    results.push({ type: 'group', title: '文章' });
    results.push(...articles);
  }
  
  // 2. 搜索评论（前端过滤，最多 5 条）
  const comments = filterComments(query);
  if (comments.length) {
    results.push({ type: 'group', title: '评论' });
    results.push(...comments);
  }
  
  // 3. 快捷操作匹配
  const actions = filterQuickActions(query);
  if (actions.length) {
    results.push({ type: 'group', title: '快捷操作' });
    results.push(...actions);
  }
  
  // 4. 无结果时显示 EmptySearch
  if (results.length === 0) {
    return [{ type: 'empty', title: '未找到结果' }];
  }
  
  return results;
}
```

### 5.5 数据源

| 数据类型 | 来源 | 说明 |
|----------|------|------|
| 文章 | `/api/v1/admin/articles` | 前端缓存，输入时过滤 |
| 评论 | `/api/v1/admin/comments` | 前端缓存，输入时过滤 |
| 页面路由 | 前端静态配置 | 管理后台所有页面路径 |
| 快捷操作 | 前端静态配置 | 常用操作入口 |
| 最近访问 | localStorage | `command-palette-recent` key |

### 5.6 键盘快捷键

| 按键 | 行为 |
|------|------|
| Cmd+K / Ctrl+K | 打开/关闭面板 |
| ↑ / ↓ | 上下选择结果 |
| Enter | 确认选择 |
| Esc | 关闭面板 |
| / | 聚焦输入框（面板已打开时） |

## 6. Acceptance Criteria

- [x] **AC-1**: Cmd+K / Ctrl+K 唤起搜索面板，再次按下关闭
- [x] **AC-2**: 支持搜索文章（按标题过滤），点击跳转编辑页
- [x] **AC-3**: 支持搜索评论（按内容过滤），点击跳转详情
- [x] **AC-4**: 支持快捷操作（"写文章"等），点击执行对应操作
- [x] **AC-5**: 键盘导航正常：↑↓ 选择，Enter 确认，Esc 关闭
- [x] **AC-6**: 空搜索时显示最近访问（5 条）+ 快捷操作
- [x] **AC-7**: 搜索结果按类型分组，显示分组标题
- [x] **AC-8**: 输入防抖 300ms，避免频繁请求
- [x] **AC-9**: 面板打开时背景锁定滚动
- [x] **AC-10**: 深色模式下面板样式正确

## 7. SDD / BDD / TDD Traceability

| ID | 层级 | 类型 | 描述 | 状态 |
|----|------|------|------|------|
| SDD-3.5.1 | 设计 | 组件接口 | CommandPaletteProps、SearchResult 类型定义 | Completed |
| SDD-3.5.2 | 设计 | 交互流程 | 唤起→搜索→选择→跳转完整流程 | Completed |
| SDD-3.5.3 | 设计 | 键盘快捷键 | 全局监听与面板内导航 | Completed |
| BDD-3.5.1 | 行为 | 唤起面板 | Given 按下 Cmd+K When 监听触发 Then 显示面板 | Completed |
| BDD-3.5.2 | 行为 | 搜索文章 | Given 输入"xxx" When 过滤 Then 显示匹配文章 | Completed |
| BDD-3.5.3 | 行为 | 键盘导航 | Given 面板打开 When 按 ↓ Then 选中下一项 | Completed |
| BDD-3.5.4 | 行为 | 空搜索 | Given 清空输入 When 渲染 Then 显示最近访问+快捷操作 | Completed |
| BDD-3.5.5 | 行为 | 选择跳转 | Given 选中文章 When 按 Enter Then 跳转编辑页并关闭面板 | Completed |
| TDD-3.5.1 | 测试 | 单元测试 | CommandPalette 渲染输入框和结果列表 | Completed |
| TDD-3.5.2 | 测试 | 单元测试 | 搜索过滤逻辑正确 | Completed |
| TDD-3.5.3 | 测试 | 单元测试 | 键盘事件处理正确 | Completed |
| TDD-3.5.4 | 测试 | E2E | 全局搜索完整流程 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 文章/评论数据量大导致前端过滤慢 | 中 | 搜索卡顿 | 限制搜索结果数量（每类最多 5 条）；使用 debounce 300ms |
| 全局快捷键冲突 | 中 | 无法唤起面板 | 检查浏览器和系统快捷键，提供备选方案；检测冲突时 fallback 到菜单按钮 |
| 面板 z-index 被其他组件覆盖 | 低 | 面板不可见 | 使用 `z-50`，确保高于所有其他组件 |
| 最近访问数据污染 | 低 | 显示异常页面 | 存储时校验 href 有效性，渲染前过滤无效项 |

## 9. Verification Plan

### 9.1 单元测试

```bash
cd frontend && npm test -- command-palette
```

- 验证搜索过滤逻辑（文章/评论/快捷操作）
- 验证键盘导航（↑↓ Enter Esc）
- 验证 debounce 行为

### 9.2 集成测试

- 验证与路由系统的集成（跳转后关闭面板）
- 验证与 localStorage 的集成（最近访问读写）

### 9.3 E2E 测试

```bash
cd frontend && npx playwright test command-palette.spec.ts
```

- 按下 Cmd+K 打开面板
- 输入关键词搜索文章
- 键盘导航选择并跳转
- 验证最近访问持久化

### 9.4 手工验证清单

- [x] Cmd+K 唤起，Esc 关闭
- [x] 搜索"测试"，显示匹配的文章和评论
- [x] 空搜索显示最近访问和快捷操作
- [x] ↑↓ 选择，Enter 跳转
- [x] 深色模式下面板正常
- [x] 移动端面板全屏显示

## 10. Completion Notes

- 实现 Command Palette 全局搜索面板组件
- 支持 Cmd+K / Ctrl+K 全局快捷键唤起/关闭
- 支持搜索文章（按标题过滤）和评论（按内容过滤），点击跳转对应页面
- 快捷操作入口：写文章、查看评论、站点设置、查看日志
- 最近访问记录（localStorage 存储最近 5 条）
- 键盘导航：↑↓ 选择，Enter 确认，Esc 关闭，输入防抖 300ms
- 面板打开时背景锁定滚动
- 关键文件：`src/components/command-palette.tsx`, `src/hooks/use-command-palette.ts`, `src/components/command-palette-provider.tsx`
- 遇到的问题：无
- 验证结果：TypeScript 0 errors, ESLint 0 errors, Build success

---

## 附录

### A. 使用示例

```typescript
// 在 AdminLayout 中挂载
export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### B. 快捷操作配置

```typescript
const QUICK_ACTIONS: SearchResult[] = [
  { id: 'new-article', type: 'action', title: '写文章', icon: PenLine, href: '/admin/articles/new' },
  { id: 'comments', type: 'action', title: '查看评论', icon: MessageSquare, href: '/admin/comments' },
  { id: 'settings', type: 'action', title: '站点设置', icon: Settings, href: '/admin/settings' },
  { id: 'logs', type: 'action', title: '查看日志', icon: ScrollText, href: '/admin/logs' },
];
```

### C. 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/command-palette.tsx` | 全局搜索面板组件 |
| `src/components/command-palette-provider.tsx` | 快捷键监听和状态管理 |
| `src/hooks/use-command-palette.ts` | 搜索逻辑 Hook |

### D. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
