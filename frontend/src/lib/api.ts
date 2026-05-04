import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

/** 默认请求超时时间（毫秒） */
const REQUEST_TIMEOUT_MS = 15_000;

interface ApiResponse<T = unknown> {
  code: number;
  flag: boolean;
  message: string;
  data: T;
}

/**
 * 读取 token：Zustand store 为单一真源。
 *
 * 跨标签登出由 Zustand persist 中间件通过 storage 事件自动同步到内存，
 * 所以这里只需读内存即可，避免「localStorage 丢失但内存还在」造成 token 泄漏
 * 或「内存丢失但 localStorage 在」导致的数据不一致。
 *
 * SSR 场景 useAuthStore.getState() 返回初始值（token=null），行为正确。
 */
function getToken(): string | null {
  return useAuthStore.getState().token ?? null;
}

// 通用请求函数
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  // 通过 store API 读取内存中的 token
  const token = getToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // 仅对只读请求（GET）设置超时，写操作不硬中断以避免幂等性问题
  const isReadOnly = !options.method || options.method === "GET";
  const controller = isReadOnly ? new AbortController() : undefined;
  const timer = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : undefined;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      toast.error("请求超时，请稍后重试");
      throw new Error(`请求超时: ${path}`);
    }
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

    // 401 时清除登录态，让 layout 跳转到登录页
    if (res.status === 401 && token) {
      useAuthStore.getState().logout();
      toast.error("登录已过期，请重新登录");
      throw new Error("登录已过期，请重新登录");
    }

    const message = serverMessage || `请求失败: ${res.status} ${res.statusText}`;
    toast.error(message);
    throw new Error(message);
  }

  const data = (await res.json()) as ApiResponse<T>;

  // 业务逻辑错误（HTTP 200 但 flag=false）由调用方处理，避免重复 toast
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
  upload: <T>(path: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<T>(path, {
      method: "POST",
      body: formData,
    });
  },
};
