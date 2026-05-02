import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("管理员仪表盘", () => {
  test("仪表盘加载，侧边栏可见", async ({ adminPage }) => {
    await adminPage.goto("/admin");
    await expect(adminPage.locator("text=后台管理系统").first()).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("分类管理", () => {
  test("分类列表显示数据", async ({ adminPage }) => {
    await adminPage.goto("/admin/categories");
    await expect(adminPage.locator("text=分类").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("标签管理", () => {
  test("标签列表显示数据", async ({ adminPage }) => {
    await adminPage.goto("/admin/tags");
    await expect(adminPage.locator("text=标签").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("说说管理", () => {
  test("说说列表加载", async ({ adminPage }) => {
    await adminPage.goto("/admin/talks");
    await expect(adminPage.locator("text=说说").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("留言管理", () => {
  test("留言列表加载", async ({ adminPage }) => {
    await adminPage.goto("/admin/messages");
    await expect(adminPage.locator("text=留言").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("评论管理", () => {
  test("评论列表加载", async ({ adminPage }) => {
    await adminPage.goto("/admin/comments");
    await expect(adminPage.locator("text=评论").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("相册管理", () => {
  test("相册列表加载", async ({ adminPage }) => {
    await adminPage.goto("/admin/albums");
    await expect(adminPage.locator("text=相册").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("站点配置", () => {
  test("站点配置页加载", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings");
    await expect(adminPage.locator("text=站点配置").first()).toBeVisible({ timeout: 10000 });
  });
});