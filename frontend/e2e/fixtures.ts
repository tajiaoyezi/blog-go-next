import { test as base, expect, type Page, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8080/api/v1";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface AuthFixtures {
  adminPage: Page;
  adminToken: string;
  apiContext: APIRequestContext;
}

// Shared token, lazily initialized
let sharedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_BASE}/login`, {
    data: {
      username: process.env.ADMIN_EMAIL || "test@qq.com",
      password: process.env.ADMIN_PASSWORD || "12345678",
    },
  });
  if (res.status() === 429) {
    throw new Error("Login rate limited (429)");
  }
  const body = await res.json();
  if (body.flag && body.data?.token) {
    return body.data.token;
  }
  throw new Error(`Login failed: ${body.message}`);
}

export const test = base.extend<AuthFixtures>({
  apiContext: async ({ request }, use) => {
    await use(request);
  },

  adminToken: async ({ apiContext }, use) => {
    if (!sharedToken) {
      if (!tokenPromise) {
        tokenPromise = loginAsAdmin(apiContext).catch(async () => {
          // Retry once after delay if rate limited
          await new Promise((r) => setTimeout(r, 3000));
          return loginAsAdmin(apiContext);
        });
      }
      sharedToken = await tokenPromise;
    }
    await use(sharedToken);
  },

  adminPage: async ({ browser, adminToken }, use) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: new URL(BASE_URL).origin,
            localStorage: [
              {
                name: "blog-auth",
                value: JSON.stringify({
                  state: {
                    token: adminToken,
                    user: {
                      userId: 1,
                      nickname: "管理员",
                      avatar: "",
                      intro: "",
                      email: "test@qq.com",
                      loginType: 1,
                    },
                  },
                  version: 0,
                }),
              },
            ],
          },
        ],
      },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };