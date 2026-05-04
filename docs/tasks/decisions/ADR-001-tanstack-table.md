# ADR-001: 使用 TanStack Table 而非自研表格

## Status

Accepted

## Context

项目中所有列表页（文章列表、评论列表、用户列表等）都需要统一支持以下功能：

- 列排序（点击表头升序/降序）
- 多条件筛选（分类、状态、时间范围等）
- 分页或虚拟滚动
- 批量操作（批量删除、批量状态变更）
- 行内操作（编辑、删除、置顶切换）
- 响应式列宽与横向滚动

自研表格组件需要投入大量时间实现上述功能，且维护成本高。

## Decision

使用 `@tanstack/react-table`（v8）作为项目统一表格解决方案。

## Rationale

1. **社区成熟**：TanStack Table 是 React 生态中最流行的表格库之一，GitHub Stars 超过 20k，社区活跃。
2. **文档完善**：官方文档详细，包含大量示例和最佳实践。
3. **与 React 深度集成**：基于 Hooks 设计，与 React 的渲染模型完全契合，支持服务端渲染（SSR）。
4. **Headless UI**：只提供逻辑层，不强制 UI 样式，可以与 shadcn/ui 无缝结合。
5. **功能完备**：内置排序、筛选、分页、分组、聚合等高级功能，无需从零实现。

## Alternatives

| 方案 | 优点 | 缺点 |
|------|------|------|
| 自研表格 | 完全可控，无依赖 | 开发周期长，维护成本高，容易出 Bug |
| AG Grid | 功能极其丰富，性能优秀 | 社区版功能受限，企业版收费，体积大 |
| Material Table | UI 美观，开箱即用 | 依赖 Material UI，与现有设计体系冲突 |

## Consequences

### 正面

- 快速实现所有列表页的表格功能
- 减少自研组件的维护负担
- 可以利用社区插件和扩展

### 负面

- 团队成员需要学习 TanStack Table 的 API（特别是 ColumnDef、useReactTable 等概念）
- 某些高度定制化的交互可能需要绕过库的默认行为

## References

- [TanStack Table 官方文档](https://tanstack.com/table/latest)
- [shadcn/ui Data Table 示例](https://ui.shadcn.com/docs/components/data-table)
