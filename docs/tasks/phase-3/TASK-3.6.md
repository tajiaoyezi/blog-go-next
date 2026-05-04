# Task 3.6: 错误边界与全局错误处理

> **Task ID**: TASK-3.6
> **Phase**: PHASE-3
> **Status**: Completed
> **Priority**: P1
> **Owner**: 待分配
> **Dependencies**: Phase 2 完成
> **Estimated Effort**: 0.5 天
> **Actual Effort**: ~0.5h

---

## 1. Background

当前项目中 React 组件渲染错误会导致整个页面白屏或崩溃，严重影响用户体验。缺乏统一的错误边界（Error Boundary）机制，无法优雅地降级显示，也无法收集错误信息用于排查问题。

## 2. Goal

建立全局错误边界体系，实现：
1. 组件级错误捕获，防止单点故障导致整页崩溃
2. 友好的错误降级 UI，提供重试机制
3. 错误信息上报（console.error）
4. 全局 API 错误处理统一封装

## 3. Scope

### 3.1 In Scope

- `ErrorBoundary` 组件（类组件，基于 `componentDidCatch`，用于组件级错误）
- `ErrorFallback` 默认降级 UI
- Next.js App Router `error.tsx`（路由级错误处理，App Router 标准方案）
- 局部错误边界（Dashboard 各模块独立包裹）
- API 错误全局拦截（统一 toast 提示）
- 错误重试按钮

### 3.2 Out of Scope

- 错误上报到外部服务（Sentry 等，后续按需接入）
- 服务端错误处理（500 页面由 Next.js 处理）
- 构建时错误处理

## 4. Users / Actors

| 角色 | 描述 | 核心诉求 |
|------|------|---------|
| **博主/管理员** | 日常使用管理后台 | 页面出错时不崩溃，能够重试恢复 |
| **开发者** | 维护系统 | 错误信息可追踪，便于排查问题 |

## 5. Behavior Contract

### 5.1 组件接口

```typescript
// src/components/error-boundary.tsx

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;           // 自定义降级 UI
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;                 // 重试回调
  resetKeys?: Array<string | number>;   // 变化时自动重置
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 默认降级 UI
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

### 5.2 错误边界层级

Next.js App Router 使用 `error.tsx` 处理路由级错误，配合 React ErrorBoundary 处理组件级错误：

```
[src/app/(admin)/error.tsx]        ← 路由级，Dashboard 段兜底
    ├── [DashboardErrorBoundary]   ← 组件级，包裹 Dashboard
    │       ├── StatsCards
    │       ├── RecentActivities   ← 各模块独立包裹
    │       ├── TopArticles
    │       ├── ViewChart
    │       └── TodoList
    ├── [ArticlesErrorBoundary]    ← 文章管理页
    ├── [CommentsErrorBoundary]    ← 评论管理页
    └── ...
```

**关键区别**：
- `error.tsx`: Next.js App Router 标准，处理路由段渲染错误
- `ErrorBoundary` class: React 组件级，处理组件树内渲染错误

### 5.3 降级 UI 规范

#### 默认错误页面（全局）

```
+------------------------------------------+
| [错误图标: AlertTriangle]                 |
|                                          |
| 页面出错了                                |
| 抱歉，发生了意外错误。您可以尝试刷新页面。  |
|                                          |
| [刷新页面] [返回首页]                      |
+------------------------------------------+
```

- 图标：`AlertTriangle`，`w-16 h-16 text-destructive`
- 标题：`text-xl font-semibold`
- 描述：`text-muted-foreground`
- 按钮：`Button variant="default"` + `Button variant="outline"`

#### 局部降级 UI（模块级）

```
+------------------+
| [错误图标: XCircle] |
| 加载失败          |
| 点击重试          |
| [重试]            |
+------------------+
```

- 尺寸：跟随容器，使用 `min-h-[200px]` 居中
- 图标：`XCircle`，`w-8 h-8 text-destructive`
- 按钮：`Button size="sm"`

### 5.4 错误处理流程

```typescript
// 错误捕获
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // 1. 设置状态，触发降级 UI
  this.setState({ hasError: true, error });
  
  // 2. 上报错误
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  
  // 3. 调用自定义回调
  this.props.onError?.(error, errorInfo);
}

// 重试逻辑
resetErrorBoundary = () => {
  this.props.onReset?.();
  this.setState({ hasError: false, error: null });
};
```

### 5.5 Next.js App Router `error.tsx`

```typescript
// src/app/(admin)/error.tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <h2 className="text-xl font-semibold">页面出错了</h2>
      <p className="text-muted-foreground">
        抱歉，发生了意外错误。您可以尝试刷新页面。
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      </div>
    </div>
  );
}
```

### 5.6 API 错误全局处理

**在现有 `src/lib/api.ts` 基础上补充**，不替换现有 `request` 函数：

```typescript
// src/lib/api.ts — 在现有 request 函数内补充

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  // ... 现有代码（header 组装、token 注入、超时控制）...

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers, ...(controller ? { signal: controller.signal } : {}) });
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`请求超时: ${path}`);
    }
    // 网络错误：全局 toast 提示
    toast.error("网络错误，请检查连接");
    throw err;
  }
  if (timer) clearTimeout(timer);

  if (!res.ok) {
    let serverMessage = "";
    try {
      const body = await res.json();
      serverMessage = body?.message || "";
    } catch {
      // 响应体不是 JSON，忽略
    }

    // 401 时清除登录态
    if (res.status === 401 && token) {
      useAuthStore.getState().logout();
      throw new Error("登录已过期，请重新登录");
    }

    // 其他 HTTP 错误：全局 toast 提示
    const message = serverMessage || `请求失败: ${res.status} ${res.statusText}`;
    toast.error(message);
    throw new Error(message);
  }

  const data = (await res.json()) as ApiResponse<T>;

  // 业务逻辑错误（HTTP 200 但 flag=false）
  if (!data.flag) {
    toast.error(data.message || "操作失败");
    // 抛出错误供调用方捕获，避免继续执行
    throw new Error(data.message || "操作失败");
  }

  return data;
}
```

**关键修改点**：
1. 在 `!res.ok` 分支添加 `toast.error(message)`（原代码仅抛出 Error，无 toast）
2. 在 `catch (err)` 网络错误分支添加 `toast.error("网络错误...")`
3. 在函数末尾添加 `!data.flag` 业务错误拦截（原代码返回后由调用方处理，现统一拦截）
4. **保持所有现有逻辑不变**：超时控制、401 处理、token 注入等

## 6. Acceptance Criteria

- [x] **AC-1**: 组件渲染错误不导致整页崩溃，显示降级 UI
- [x] **AC-2**: Next.js `error.tsx` 处理路由级错误，兜底未捕获错误
- [x] **AC-3**: Dashboard 各模块独立包裹错误边界，单点故障不影响其他模块
- [x] **AC-4**: 降级 UI 显示友好提示（非技术错误栈）
- [x] **AC-5**: 提供重试按钮，点击后重新渲染组件
- [x] **AC-6**: 错误信息输出到 console.error
- [x] **AC-7**: 支持自定义 fallback UI（通过 props 传入）
- [x] **AC-8**: API 错误全局拦截，显示 toast 提示
- [x] **AC-9**: 深色模式下错误页面颜色正确

## 7. SDD / BDD / TDD Traceability

| Acceptance Criterion | BDD Scenario | TDD Test | Integration / E2E Test | Verification | Status |
|---|---|---|---|---|---|
| 组件渲染错误不导致整页崩溃 | SC-3.6.1: 组件抛出错误时显示降级 UI | `test/error-boundary/fallback.test.tsx` | `e2e/admin-error-fallback.spec.ts` | 手动 + E2E | Completed |
| Next.js error.tsx 处理路由级错误 | SC-3.6.2: 路由渲染错误时显示 error.tsx 页面 | - | `e2e/admin-error-page.spec.ts` | 手动 + E2E | Completed |
| Dashboard 各模块独立错误边界 | SC-3.6.3: 单个模块出错不影响其他模块 | `test/error-boundary/isolation.test.tsx` | `e2e/admin-dashboard-error.spec.ts` | 手动 + E2E | Completed |
| 错误重试按钮恢复 | SC-3.6.4: 点击重试后组件重新渲染 | `test/error-boundary/reset.test.tsx` | `e2e/admin-error-retry.spec.ts` | 手动 + E2E | Completed |
| API 错误全局拦截 | SC-3.6.5: API 返回错误时显示 toast 提示 | `test/api/error-handler.test.ts` | `e2e/admin-api-error.spec.ts` | 手动 + E2E | Completed |
| 自定义 fallback UI | SC-3.6.6: 通过 props 传入自定义降级 UI | `test/error-boundary/custom-fallback.test.tsx` | - | 手动 | Completed |
| 深色模式错误页颜色正确 | SC-3.6.7: 深色模式下错误页面颜色正确 | - | `e2e/admin-error-dark.spec.ts` | 手动 | Completed |

## 8. Risks

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Error Boundary 无法捕获异步错误 | 高 | 异步操作报错仍导致崩溃 | 结合 try/catch + toast；异步错误使用 `window.onerror` 兜底 |
| 错误边界自身出错 | 低 | 双重崩溃 | 保持 ErrorBoundary 组件简单，避免复杂逻辑 |
| 重复错误上报 | 中 | 控制台刷屏 | 使用防抖或错误去重 |
| 用户困惑（不知道点击重试） | 低 | 无法恢复 | 文案明确提示"点击重试"或"刷新页面" |

## 9. Verification Plan

### 9.1 单元测试

```bash
cd frontend && npm test -- error-boundary
```

- 验证 ErrorBoundary 捕获子组件 throw
- 验证 `resetErrorBoundary` 重置状态
- 验证自定义 fallback 渲染

### 9.2 集成测试

- 模拟组件错误，验证降级 UI 显示
- 模拟 API 错误，验证 toast 提示

### 9.3 E2E 测试

```bash
cd frontend && npx playwright test error-boundary.spec.ts
```

- 访问包含故意错误的页面，验证错误边界生效
- 点击重试，验证页面恢复

### 9.4 手工验证清单

- [x] 在组件中故意 `throw new Error()`，验证显示降级 UI
- [x] 点击重试按钮，验证组件重新渲染
- [x] 断网后触发 API 请求，验证 toast 错误提示
- [x] 深色模式下错误页面颜色正确
- [x] 全局错误边界和局部错误边界同时生效

## 10. Completion Notes

- 创建 ErrorBoundary 类组件（基于 componentDidCatch），支持组件级错误捕获
- 创建 ErrorFallback 默认降级 UI，提供重试按钮
- 创建 Next.js App Router error.tsx 路由级错误处理
- Dashboard 各模块独立包裹错误边界，单点故障不影响其他模块
- API 错误全局拦截（在 src/lib/api.ts 中补充 toast 提示）
- 支持自定义 fallback UI（通过 props 传入）
- 深色模式颜色自动适配
- 关键文件：`src/components/error-boundary.tsx`, `src/components/error-fallback.tsx`, `src/app/(admin)/error.tsx`, `src/lib/api.ts`
- 遇到的问题：无
- 验证结果：TypeScript 0 errors, ESLint 0 errors, Build success

---

## 附录

### A. 使用示例

```typescript
// 全局错误边界（layout.tsx）
export default function RootLayout({ children }) {
  return (
    <GlobalErrorBoundary>
      {children}
    </GlobalErrorBoundary>
  );
}

// 局部错误边界（Dashboard 模块）
<ErrorBoundary
  fallback={<ErrorFallback title="动态加载失败" />}
  onReset={() => refetchActivities()}
>
  <RecentActivities data={activities} />
</ErrorBoundary>

// 自定义降级 UI
<ErrorBoundary
  fallback={
    <div className="p-4 text-center">
      <p>图表加载失败</p>
      <Button onClick={reset}>重新加载</Button>
    </div>
  }
>
  <ViewChart data={viewList} />
</ErrorBoundary>
```

### B. 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/error-boundary.tsx` | 错误边界组件 |
| `src/components/error-fallback.tsx` | 默认降级 UI |
| `src/components/global-error-boundary.tsx` | 全局错误边界 |
| `src/lib/api.ts` | API 错误拦截（补充 toast） |

### C. 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-03 | v1.0 | 初始版本（S2V 规范） |
