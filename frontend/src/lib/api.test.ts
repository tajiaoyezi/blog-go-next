import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./api";

// Mock auth store
vi.mock("@/stores/auth", () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({
      token: "test-token",
      logout: vi.fn(),
    }),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("API Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("makes GET request with auth token", async () => {
    const mockData = { code: 20000, flag: true, message: "success", data: { id: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await api.get("/test");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it("makes POST request with JSON body", async () => {
    const mockData = { code: 20000, flag: true, message: "success", data: null };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const body = { name: "test" };
    await api.post("/test", body);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("makes PUT request", async () => {
    const mockData = { code: 20000, flag: true, message: "success", data: null };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    await api.put("/test/1", { name: "updated" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test/1"),
      expect.objectContaining({
        method: "PUT",
      })
    );
  });

  it("makes DELETE request with body", async () => {
    const mockData = { code: 20000, flag: true, message: "success", data: null };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const body = [1, 2, 3];
    await api.delete("/test", body);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify(body),
      })
    );
  });

  it("uploads file with FormData", async () => {
    const mockData = { code: 20000, flag: true, message: "success", data: "url" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const file = new File(["content"], "test.png", { type: "image/png" });
    await api.upload("/upload", file);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const options = fetchCall[1] as RequestInit;
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.headers).not.toHaveProperty("Content-Type");
  });

  it("handles 401 unauthorized", async () => {
    const { toast } = await import("sonner");
    const { useAuthStore } = await import("@/stores/auth");
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "登录已过期" }),
    });

    await expect(api.get("/test")).rejects.toThrow("登录已过期");
    expect(useAuthStore.getState().logout).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("登录已过期，请重新登录");
  });

  it("handles network error", async () => {
    const { toast } = await import("sonner");
    
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(api.get("/test")).rejects.toThrow("Network error");
    expect(toast.error).toHaveBeenCalledWith("网络错误，请检查连接");
  });

  it("handles timeout error", async () => {
    const { toast } = await import("sonner");
    
    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new DOMException("Timeout", "AbortError");
          reject(error);
        }, 100);
      });
    });

    await expect(api.get("/test")).rejects.toThrow("请求超时");
    expect(toast.error).toHaveBeenCalledWith("请求超时，请稍后重试");
  });

  it("handles non-JSON error response", async () => {
    const { toast } = await import("sonner");
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("Not JSON")),
    });

    await expect(api.get("/test")).rejects.toThrow("请求失败: 500");
  });

  it("returns business error data without throwing", async () => {
    const mockData = { code: 40001, flag: false, message: "参数错误", data: null };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await api.get("/test");
    expect(result).toEqual(mockData);
    expect(result.flag).toBe(false);
  });
});
