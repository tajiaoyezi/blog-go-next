import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarkdownToolbar } from "./markdown-toolbar";

describe("MarkdownToolbar", () => {
  it("renders all toolbar buttons", () => {
    const onCommand = vi.fn();
    render(<MarkdownToolbar onCommand={onCommand} />);

    // Check for all command buttons by aria-label
    expect(screen.getByLabelText("加粗")).toBeInTheDocument();
    expect(screen.getByLabelText("斜体")).toBeInTheDocument();
    expect(screen.getByLabelText("删除线")).toBeInTheDocument();
    expect(screen.getByLabelText("标题")).toBeInTheDocument();
    expect(screen.getByLabelText("引用")).toBeInTheDocument();
    expect(screen.getByLabelText("行内代码")).toBeInTheDocument();
    expect(screen.getByLabelText("代码块")).toBeInTheDocument();
    expect(screen.getByLabelText("链接")).toBeInTheDocument();
    expect(screen.getByLabelText("图片")).toBeInTheDocument();
    expect(screen.getByLabelText("分割线")).toBeInTheDocument();
    expect(screen.getByLabelText("无序列表")).toBeInTheDocument();
    expect(screen.getByLabelText("有序列表")).toBeInTheDocument();
  });

  it("calls onCommand when button clicked", () => {
    const onCommand = vi.fn();
    render(<MarkdownToolbar onCommand={onCommand} />);

    const boldButton = screen.getByLabelText("加粗");
    fireEvent.click(boldButton);

    expect(onCommand).toHaveBeenCalledWith("bold");
  });

  it("calls onCommand with correct command for each button", () => {
    const onCommand = vi.fn();
    render(<MarkdownToolbar onCommand={onCommand} />);

    const commands = [
      { label: "加粗", id: "bold" },
      { label: "斜体", id: "italic" },
      { label: "删除线", id: "strikethrough" },
      { label: "标题", id: "heading" },
      { label: "引用", id: "quote" },
      { label: "行内代码", id: "code" },
      { label: "代码块", id: "codeBlock" },
      { label: "链接", id: "link" },
      { label: "图片", id: "image" },
      { label: "分割线", id: "hr" },
      { label: "无序列表", id: "unorderedList" },
      { label: "有序列表", id: "orderedList" },
    ];

    commands.forEach(({ label, id }) => {
      const button = screen.getByLabelText(label);
      fireEvent.click(button);
      expect(onCommand).toHaveBeenCalledWith(id);
    });

    expect(onCommand).toHaveBeenCalledTimes(commands.length);
  });

  it("disables buttons when disabled prop is true", () => {
    const onCommand = vi.fn();
    render(<MarkdownToolbar onCommand={onCommand} disabled={true} />);

    const boldButton = screen.getByLabelText("加粗");
    expect(boldButton).toBeDisabled();

    fireEvent.click(boldButton);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("shows keyboard shortcuts in title", () => {
    render(<MarkdownToolbar onCommand={vi.fn()} />);

    const boldButton = screen.getByLabelText("加粗");
    expect(boldButton).toHaveAttribute("title", "加粗 (Ctrl+B)");

    const italicButton = screen.getByLabelText("斜体");
    expect(italicButton).toHaveAttribute("title", "斜体 (Ctrl+I)");

    const linkButton = screen.getByLabelText("链接");
    expect(linkButton).toHaveAttribute("title", "链接 (Ctrl+K)");
  });

  it("shows only label in title when no shortcut", () => {
    render(<MarkdownToolbar onCommand={vi.fn()} />);

    const quoteButton = screen.getByLabelText("引用");
    expect(quoteButton).toHaveAttribute("title", "引用");
  });

  it("renders buttons in groups with separators", () => {
    const { container } = render(<MarkdownToolbar onCommand={vi.fn()} />);

    // Should have separator divs between groups
    const separators = container.querySelectorAll(".bg-border");
    expect(separators.length).toBeGreaterThan(0);
  });

  it("has correct button styling", () => {
    render(<MarkdownToolbar onCommand={vi.fn()} />);

    const button = screen.getByLabelText("加粗");
    expect(button).toHaveClass("rounded-md");
    expect(button).toHaveClass("hover:bg-accent");
  });
});
