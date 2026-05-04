import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore, useHydrated } from "./auth";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("initializes with null token and user", () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("sets auth data", () => {
    const mockUser = {
      userId: 1,
      nickname: "测试用户",
      avatar: "avatar.jpg",
      intro: "简介",
      email: "test@example.com",
      loginType: 1,
    };

    act(() => {
      useAuthStore.getState().setAuth("test-token", mockUser);
    });

    const { token, user } = useAuthStore.getState();
    expect(token).toBe("test-token");
    expect(user).toEqual(mockUser);
  });

  it("clears auth data on logout", () => {
    const mockUser = {
      userId: 1,
      nickname: "测试用户",
      avatar: "avatar.jpg",
      intro: "简介",
      email: "test@example.com",
      loginType: 1,
    };

    act(() => {
      useAuthStore.getState().setAuth("test-token", mockUser);
    });

    act(() => {
      useAuthStore.getState().logout();
    });

    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("updates state reactively", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.token).toBeNull();

    act(() => {
      result.current.setAuth("new-token", {
        userId: 2,
        nickname: "新用户",
        avatar: "",
        intro: "",
        email: "",
        loginType: 1,
      });
    });

    expect(result.current.token).toBe("new-token");
    expect(result.current.user?.nickname).toBe("新用户");
  });
});

describe("useHydrated", () => {
  it("returns hydration state", () => {
    const { result } = renderHook(() => useHydrated());
    
    // Should return boolean
    expect(typeof result.current).toBe("boolean");
  });
});
