import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommandPalette } from "./command-palette";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when closed", () => {
    render(<CommandPalette />);
    
    expect(screen.queryByPlaceholderText(/搜索/)).not.toBeInTheDocument();
  });

  it("opens with Cmd+K shortcut", () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    
    expect(screen.getByPlaceholderText(/搜索/)).toBeInTheDocument();
  });

  it("opens with Ctrl+K shortcut", () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    
    expect(screen.getByPlaceholderText(/搜索/)).toBeInTheDocument();
  });

  it("closes with Escape key", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByPlaceholderText(/搜索/)).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText(/搜索/);
    fireEvent.keyDown(input, { key: "Escape" });
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/搜索/)).not.toBeInTheDocument();
    });
  });

  it("closes when clicking overlay", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    
    const overlay = document.querySelector(".bg-black\\/50");
    if (overlay) {
      fireEvent.click(overlay);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/搜索/)).not.toBeInTheDocument();
      });
    }
  });

  it("shows quick actions when empty query", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    
    // Should show quick actions group
    await waitFor(() => {
      const quickActions = screen.getAllByText("快捷操作");
      expect(quickActions.length).toBeGreaterThan(0);
    });
    expect(screen.getByText("写文章")).toBeInTheDocument();
  });

  it("filters results on search", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    
    const input = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(input, { target: { value: "文章" } });
    
    // Should show filtered results or loading
    await waitFor(() => {
      expect(screen.getByText("加载中...") || screen.queryByText("文章")).toBeTruthy();
    });
  });

  it("shows 'no results' when no match", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    
    const input = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(input, { target: { value: "xyz123" } });
    
    await waitFor(() => {
      expect(screen.getByText("未找到结果")).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation with arrow keys", async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    
    const input = screen.getByPlaceholderText(/搜索/);
    
    // Press arrow down to select first item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    
    // Press Enter to select
    fireEvent.keyDown(input, { key: "Enter" });
    
    // Should close palette
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/搜索/)).not.toBeInTheDocument();
    });
  });
});
