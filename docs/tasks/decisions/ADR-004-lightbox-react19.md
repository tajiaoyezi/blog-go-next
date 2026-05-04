# ADR-004: Lightbox React 19 兼容性评估与决策

## Status

Accepted

## Date

2026-05-03

## Context

Phase 4 需要实现相册大图预览功能。Master Spec 指定使用 `yet-another-react-lightbox@^3.21.8`（已支持 React 19）。

经 `npm info` 验证，`yet-another-react-lightbox@3.21.8+` 的 `peerDependencies` 已包含 `react: '^16.8.0 || ^17 || ^18 || ^19'`，**原生支持 React 19**。v3.21.8 之前的版本仅支持到 React 18，但当前最新版本已解决兼容性问题。

## Decision

**主方案**：直接使用 `yet-another-react-lightbox@^3.21.8`（最新稳定版），无需兼容性验证即可使用。

**降级方案**：保留自研 Lightbox 方案（基于 shadcn Dialog + framer-motion），仅在主方案出现未预期问题时启用。

## Rationale

1. **React 19 兼容性已解决**：v3.21.8+ 明确支持 React 19，peerDependencies 无冲突
2. **功能完善**：支持图片放大、缩放、切换、键盘导航、移动端触摸手势，满足全部需求
3. **维护成本低**：社区活跃，持续更新，无需自行维护复杂交互逻辑
4. **技术栈一致**：基于 React，与项目技术栈完全契合

## Alternatives

| 方案 | 优点 | 缺点 |
|------|------|------|
| `yet-another-react-lightbox@^3.21.8` | 功能完善，社区活跃，**已支持 React 19** | 需要升级到较新版本 |
| 自研 Lightbox | 完全可控，无依赖风险 | 需自行实现缩放/拖拽/手势，维护成本高 |
| `photoswipe` | 功能丰富，原生性能 | 原生 JS 方案，React 集成复杂 |

## Consequences

### 正面

- 直接使用社区成熟方案，无需自研复杂交互（缩放/拖拽/手势）
- 与 React 19 完全兼容，无 peer dependency 冲突
- 维护成本低，社区持续更新

### 负面

- 需要升级到较新版本（v3.21.8+），但升级成本极低

## Rollback Or Migration Plan

若主方案出现未预期问题：
1. 卸载 `yet-another-react-lightbox`
2. 基于 `src/components/ui/dialog` 实现自研 Lightbox
3. 使用 `framer-motion` 实现过渡动画
4. 保留相同接口：`LightboxProps { images, open, index, onClose, onIndexChange }`

## Follow-ups

- [x] 已验证 `yet-another-react-lightbox@3.21.8+` 支持 React 19（`npm info` 确认）
- [ ] TASK-4.3 执行时安装 `yet-another-react-lightbox@^3.21.8`
- [ ] 安装后运行 `npm run build` 验证构建无错误
- [ ] 降级方案代码保留在 `src/components/lightbox/fallback/`（备选）

## References

- [yet-another-react-lightbox GitHub](https://github.com/igordanchenko/yet-another-react-lightbox)
- [Phase 4 Task 4.3](../phase-4/TASK-4.3.md)
