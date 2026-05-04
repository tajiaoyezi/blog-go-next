import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 100));
    expect(result.current).toBe("initial");
  });

  it("debounces value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 50 } }
    );

    expect(result.current).toBe("initial");

    rerender({ value: "changed", delay: 50 });
    expect(result.current).toBe("initial");

    await waitFor(() => expect(result.current).toBe("changed"), {
      timeout: 200,
    });
  });

  it("resets timer on rapid changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 50 } }
    );

    rerender({ value: "a", delay: 50 });
    
    // Wait a bit but not long enough for debounce
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(result.current).toBe("initial");

    rerender({ value: "b", delay: 50 });
    
    // Wait for the debounce to complete
    await waitFor(() => expect(result.current).toBe("b"), {
      timeout: 200,
    });
  });

  it("works with number values", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: number; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 50 } }
    );

    rerender({ value: 42, delay: 50 });
    expect(result.current).toBe(0);

    await waitFor(() => expect(result.current).toBe(42), {
      timeout: 200,
    });
  });

  it("cleans up timeout on unmount", () => {
    const { unmount } = renderHook(() => useDebounce("test", 1000));
    
    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });
});
