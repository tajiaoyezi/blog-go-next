import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary";

// Component that throws error
const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">正常内容</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders fallback UI when error occurs", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError message="测试错误" />
      </ErrorBoundary>
    );

    expect(screen.getByText("加载失败")).toBeInTheDocument();
    expect(screen.getByText("测试错误")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("calls onError callback when error occurs", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError message="回调测试" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "回调测试" }),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it("resets error boundary when retry button clicked", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError message="可恢复错误" />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole("button", { name: "重试" });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    expect(onReset).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">自定义降级</div>}>
        <ThrowError message="自定义测试" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.queryByText("加载失败")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("resets when resetKeys change", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary resetKeys={["key1"]}>
        <ThrowError message="resetKeys 测试" />
      </ErrorBoundary>
    );

    expect(screen.getByText("加载失败")).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKeys={["key2"]}>
        <div data-testid="recovered">已恢复</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId("recovered")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
