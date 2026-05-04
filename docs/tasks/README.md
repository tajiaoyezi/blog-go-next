# Master Spec: blog-go-next 前端 UI 优化

> **SDD 层级**: Master Spec（项目总规格）
> **S2V 规范**: Spec-to-Verification Development Standard
> **项目适配层**: `docs/ADAPTER.md`
> **创建日期**: 2026-05-03
> **版本**: v2.0-S2V

---

## 1. 背景

blog-go-next 是一个全栈博客系统，前端使用 Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui。当前管理后台（`/admin/*`）已完成基础功能，但 UI 交互深度、信息密度和用户体验与业界标杆（Halo 2.x Console）存在明显差距。

本次优化的目标是通过 5 个 Phase 的渐进式升级，将管理后台从"可用"升级为"好用"。

## 2. 目标

### 2.1 总体目标

通过 SDD → BDD → TDD → Integration/E2E → ADR 的完整流程，实现：

- **信息密度提升**: 单屏展示更多信息，减少翻页
- **操作效率提升**: 支持批量操作、快捷筛选、智能搜索
- **视觉体验提升**: 统一的骨架屏、空状态、动画反馈
- **移动端可用**: 管理后台在平板/手机上基本可用

### 2.2 可量化目标

| 指标 | 当前 | 目标 |
|------|------|------|
| 列表页操作步骤（筛选+排序+批量删除） | 6+ 步 | 3 步 |
| 首屏加载时间（4G） | 未知 | < 2s |
| 管理后台移动端可用度 | 不可用 | 基础功能可用 |
| 列表页信息密度 | 10 行/屏 | 15 行/屏 |

## 3. 范围与非范围

### 3.1 范围（In Scope）

- 管理后台所有页面 (`/admin/*`)
- 通用组件库扩展（DataTable、Editor、MediaGallery 等）
- 全局交互体验（加载、空状态、错误处理）
- 响应式适配（管理后台 + 博客端）
- 技术决策记录（ADR）

### 3.2 非范围（Out of Scope）

- 后端 API 改造（仅使用现有 API，新 API 需求需协商）
- 主题系统（保持现有 Thymeleaf 主题）
- 博客端功能增强（仅做响应式适配）
- 用户/角色/权限管理（15 个 placeholder 路由保持现状）

## 4. 用户与角色

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 博客所有者，日常使用管理后台 | 高效管理内容、快速发布文章、便捷查看数据 |
| **访客** | 浏览博客的普通用户 | 流畅的阅读体验、清晰的导航 |

## 5. 核心流程

```
[管理员登录]
    ↓
[Dashboard 概览] → 查看统计数据、最近动态、待办提醒
    ↓
[内容管理] → 文章/评论/留言/说说 CRUD
    ↓
[媒体管理] → 相册/图片上传与管理
    ↓
[站点配置] → 站点信息、SEO、主题设置
```

## 6. 技术约束

### 6.1 技术栈

```yaml
框架: Next.js 16 (App Router) + React 19
样式: Tailwind CSS 4 + shadcn/ui
状态管理: Zustand
HTTP 客户端: 现有 api.ts 封装
图标: lucide-react
图表: recharts
通知: sonner
```

### 6.2 设计约束

- **必须**使用现有 shadcn/ui 组件，保持设计一致性
- **必须**兼容现有 API 响应格式 (`{code, flag, message, data}`)
- **必须**支持深色模式（现有 next-themes）
- **应该**使用 TypeScript 严格模式
- **应该**保持现有文件组织结构

### 6.3 新增依赖

| 依赖 | 版本 | 用途 | 安装时机 |
|------|------|------|---------|
| `@tanstack/react-table` | v8.x | 数据表格核心 | Phase 1 |
| ~~`react-dropzone`~~ | ~~v14.x~~ | ~~文件拖拽上传~~ | ~~已移除~~ |
| **原生实现** | — | HTML5 Drag and Drop API + `<input type="file">` | Phase 2/4 |
| `framer-motion` | ^11.13.5 | 动画效果（首个支持 React 19 的版本） | Phase 3 |
 | `yet-another-react-lightbox` | ^3.21.8 | 图片大图预览（已支持 React 19） | Phase 4 |

## 7. 质量标准

### 7.1 性能标准

- 首屏加载 < 2s（4G 网络）
- 表格切换页 < 300ms
- 对话框打开 < 100ms
- 图片懒加载使用 Intersection Observer

### 7.2 可访问性标准

- 所有表单元素关联 label
- 按钮/链接有明确的 aria-label
- 支持键盘导航（Tab/Enter/Escape）
- 颜色对比度符合 WCAG 2.1 AA

### 7.3 代码标准

- 组件文件不超过 300 行（超过则拆分）
- Hook 职责单一
- 避免 `any` 类型
- 复杂逻辑必须有注释

## 8. 风险登记册

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| TanStack Table 学习成本 | 中 | 延迟 1-2 天 | 预留 buffer，参考官方示例 |
| React 19 兼容性问题 | 低 | 组件异常 | 逐步引入，及时测试 |
| 后端 API 不满足需求 | 高 | 功能无法实现 | 先前端 mock，再协商后端 |
| 移动端测试遗漏 | 中 | 体验差 | DevTools 模拟多设备 |
| MDEditor 工具栏无法定制 | 中 | Phase 2 核心功能受阻 | 预研 API，准备 Tiptap 备选 |
| Lightbox 不兼容 React 19 | 中 | Phase 4 预览功能失效 | 验证兼容性，准备降级方案 |

## 9. 阶段规划

| Phase | 主题 | 工期 | 任务数 | 优先级 | 规格文件 |
|-------|------|------|--------|--------|---------|
| Phase 1 | 数据表格全面升级 | 5 天 | 6 | P0 | `docs/tasks/phase-1/README.md` |
| Phase 2 | 编辑器与表单增强 | 7 天 | 7 | P1 | `docs/tasks/phase-2/README.md` |
| Phase 3 | Dashboard & 全局体验 | 5 天 | 6 | P1 | `docs/tasks/phase-3/README.md` |
| Phase 4 | 相册/媒体管理升级 | 4 天 | 4 | P2 | `docs/tasks/phase-4/README.md` |
| Phase 5 | 移动端适配 | 3 天 | 5 | P2 | `docs/tasks/phase-5/README.md` |
| **总计** | | **24 天** | **28** | | |

## 10. 决策记录索引

| ADR | 标题 | 状态 | 文件 |
|-----|------|------|------|
| ADR-001 | 使用 TanStack Table 而非自研表格 | 已接受 | `docs/tasks/decisions/ADR-001-tanstack-table.md` |
| ADR-002 | 保持现有 Markdown 编辑器，渐进增强 | 已接受 | `docs/tasks/decisions/ADR-002-keep-md-editor.md` |
| ADR-003 | 使用 shadcn/ui 设计体系，不引入新 UI 库 | 已接受 | `docs/tasks/decisions/ADR-003-shadcn-only.md` |
| ADR-004 | Lightbox React 19 兼容性评估与决策 | 已接受 | `docs/tasks/decisions/ADR-004-lightbox-react19.md` |

## 11. 追踪总览

| Phase | 验收标准总数 | BDD 场景数 | E2E 测试数 | 状态 |
|-------|-------------|-----------|-----------|------|
| Phase 1 | 35 | 28 | 28 | Not Started |
| Phase 2 | 42 | 35 | 28 | Not Started |
| Phase 3 | 30 | 25 | 20 | Not Started |
| Phase 4 | 20 | 18 | 15 | Not Started |
| Phase 5 | 25 | 20 | 15 | Not Started |

---

## 附录

### A. 参考资源

- Halo 2.x UI 源码: `https://github.com/halo-dev/halo/tree/main/ui`
- TanStack Table 文档: `https://tanstack.com/table/latest`
- shadcn/ui 文档: `https://ui.shadcn.com`
- S2V 完整规范: `/Users/leaf/.claude/skills/s2v-development/full-standard.md`

### B. 术语表

| 术语 | 定义 |
|------|------|
| SDD | Spec-Driven Development，规格驱动开发 |
| BDD | Behavior-Driven Development，行为驱动开发 |
| TDD | Test-Driven Development，测试驱动开发 |
| ADR | Architecture Decision Record，架构决策记录 |
| DoR | Definition of Ready，就绪定义 |
| DoD | Definition of Done，完成定义 |
| Skeleton | 骨架屏，加载状态的占位 UI |
| Lightbox | 图片大图预览组件 |

### C. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（非 S2V） |
| 2026-05-03 | v2.0-S2V | 按 S2V 规范重写，添加适配层、追踪表、BDD 场景、ADR 索引 |
