"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    if (
      this.state.hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      (resetKeys.length !== prevProps.resetKeys.length ||
        resetKeys.some((key, i) => key !== prevProps.resetKeys![i]))
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error!}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

/* ==============================
 * 默认降级 UI
 * ============================== */

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <h3 className="text-sm font-semibold">加载失败</h3>
      <p className="text-xs text-muted-foreground">{error.message || "组件渲染出错"}</p>
      <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
        重试
      </Button>
    </div>
  );
}
