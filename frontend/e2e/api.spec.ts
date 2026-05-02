import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8080/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "test@qq.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345678";

test.describe.configure({ mode: "serial" });

test.describe("公开 API 健康检查", () => {
  test("/health 返回 ok", async ({ request }) => {
    const res = await request.get(`${API_BASE.replace("/api/v1", "")}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("公开数据接口", () => {
  test("GET /articles 返回分页数据", async ({ request }) => {
    const res = await request.get(`${API_BASE}/articles?current=1&size=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
    expect(body.data).toBeDefined();
  });

  test("GET /categories 返回分类列表", async ({ request }) => {
    const res = await request.get(`${API_BASE}/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
  });

  test("GET /tags 返回标签列表", async ({ request }) => {
    const res = await request.get(`${API_BASE}/tags`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
  });

  test("GET /talks 返回说说列表", async ({ request }) => {
    const res = await request.get(`${API_BASE}/talks?current=1&size=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
  });

  test("GET /links 返回友链列表", async ({ request }) => {
    const res = await request.get(`${API_BASE}/links`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
  });

  test("GET /messages 返回留言列表", async ({ request }) => {
    const res = await request.get(`${API_BASE}/messages?current=1&size=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
  });

  test("GET /website/config 返回站点配置", async ({ request }) => {
    const res = await request.get(`${API_BASE}/website/config`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flag).toBe(true);
  });
});

test.describe("认证接口", () => {
  test("POST /login 管理员登录成功", async ({ request }) => {
    const res = await request.post(`${API_BASE}/login`, {
      data: { username: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      maxRedirects: 0,
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.flag).toBe(true);
      expect(body.data.token).toBeDefined();
    }
  });

  test("POST /login 错误密码登录失败", async ({ request }) => {
    const res = await request.post(`${API_BASE}/login`, {
      data: { username: ADMIN_EMAIL, password: "wrongpassword123" },
    });
    if (res.status() === 429) {
      test.skip(true, "Rate limited");
      return;
    }
    const body = await res.json();
    expect(body.flag).toBe(false);
  });

  test("无 token 访问 admin 接口返回 401", async ({ request }) => {
    const res = await request.get(`${API_BASE}/admin`);
    expect(res.status()).toBe(401);
  });
});