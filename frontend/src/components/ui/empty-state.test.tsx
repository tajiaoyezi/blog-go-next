import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";
import { FileText, Search } from "lucide-react";

describe("EmptyState", () => {
  it("renders with icon, title, and description", () => {
    render(
      <EmptyState
        icon={FileText}
        title="暂无文章"
        description="点击按钮发布第一篇文章"
      />
    );

    expect(screen.getByText("暂无文章")).toBeInTheDocument();
    expect(screen.getByText("点击按钮发布第一篇文章")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    render(<EmptyState icon={Search} title="未找到结果" />);
    
    expect(screen.getByText("未找到结果")).toBeInTheDocument();
    expect(screen.queryByText(/点击按钮/)).not.toBeInTheDocument();
  });

  it("renders action button with href", () => {
    render(
      <EmptyState
        icon={FileText}
        title="暂无文章"
        action={{ label: "写文章", href: "/admin/articles/editor" }}
      />
    );

    const button = screen.getByRole("button", { name: "写文章" });
    expect(button).toBeInTheDocument();
  });

  it("renders action button with onClick", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={FileText}
        title="暂无文章"
        action={{ label: "写文章", onClick: handleClick }}
      />
    );

    const button = screen.getByRole("button", { name: "写文章" });
    expect(button).toBeInTheDocument();
  });

  it("does not render button when action is not provided", () => {
    render(<EmptyState icon={FileText} title="暂无数据" />);
    
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("supports different sizes", () => {
    const { rerender } = render(
      <EmptyState icon={FileText} title="测试" size="sm" />
    );
    
    expect(screen.getByText("测试")).toHaveClass("text-sm");

    rerender(<EmptyState icon={FileText} title="测试" size="lg" />);
    
    expect(screen.getByText("测试")).toHaveClass("text-xl");
  });

  it("renders without icon when not provided", () => {
    render(<EmptyState title="无图标" />);
    
    expect(screen.getByText("无图标")).toBeInTheDocument();
    expect(document.querySelectorAll("svg").length).toBe(0);
  });
});
