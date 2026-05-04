import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoSave } from "./use-auto-save";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("saves draft to localStorage", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        enabled: true,
      })
    );

    act(() => {
      result.current.saveDraft();
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(1);
    expect(drafts[0].title).toBe("测试标题");
    expect(drafts[0].content).toBe("测试内容");
  });

  it("does not save when disabled", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        enabled: false,
      })
    );

    act(() => {
      result.current.saveDraft();
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(0);
  });

  it("does not save empty title or content", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "",
        content: "",
        enabled: true,
      })
    );

    act(() => {
      result.current.saveDraft();
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(0);
  });

  it("limits drafts to MAX_DRAFTS", () => {
    const { result, rerender } = renderHook(
      ({ id, title }: { id: number; title: string }) =>
        useAutoSave({ id, title, content: "内容", enabled: true }),
      { initialProps: { id: 1, title: "草稿1" } }
    );

    // Save first draft
    act(() => {
      result.current.saveDraft();
    });

    for (let i = 2; i <= 5; i++) {
      rerender({ id: i, title: `草稿${i}` });
      act(() => {
        result.current.saveDraft();
      });
    }

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(3);
  });

  it("loads draft by id", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        id: 1,
        title: "测试标题",
        content: "测试内容",
        enabled: true,
      })
    );

    act(() => {
      result.current.saveDraft();
    });

    const draft = result.current.loadDraft();
    expect(draft).not.toBeNull();
    expect(draft?.title).toBe("测试标题");
    expect(draft?.id).toBe(1);
  });

  it("clears draft by id", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        id: 1,
        title: "测试标题",
        content: "测试内容",
        enabled: true,
      })
    );

    act(() => {
      result.current.saveDraft();
    });

    act(() => {
      result.current.clearDraft();
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(0);
  });

  it("auto saves on interval", async () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        interval: 1000,
        enabled: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
      expect(drafts.length).toBe(1);
    });
  });

  it("updates lastSaved timestamp after save", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        enabled: true,
      })
    );

    expect(result.current.lastSaved).toBe(0);

    act(() => {
      result.current.saveDraft();
    });

    expect(result.current.lastSaved).toBeGreaterThan(0);
  });

  it("saves on Ctrl+S keyboard shortcut", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        enabled: true,
      })
    );

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
      });
      document.dispatchEvent(event);
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(1);
  });

  it("saves on beforeunload event", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        enabled: true,
      })
    );

    act(() => {
      const event = new Event("beforeunload");
      window.dispatchEvent(event);
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(1);
  });

  it("does not save on Ctrl+S when disabled", () => {
    renderHook(() =>
      useAutoSave({
        title: "测试标题",
        content: "测试内容",
        enabled: false,
      })
    );

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
      });
      document.dispatchEvent(event);
    });

    const drafts = JSON.parse(localStorage.getItem("article-draft") || "[]");
    expect(drafts.length).toBe(0);
  });
});
