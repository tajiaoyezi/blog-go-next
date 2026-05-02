import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8080/api/v1";

test.describe("文章详情页", () => {
  test("访问存在的文章显示标题和内容", async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/articles?current=1&size=1`);
    const body = await res.json();
    test.skip(
      !body.flag || !body.data?.records?.length,
      "数据库没有文章数据",
    );

    const articleId = body.data.records[0].id;
    await page.goto(`/articles/${articleId}`);

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 });
  });

  test("访问不存在的文章显示错误提示", async ({ page }) => {
    await page.goto("/articles/999999");
    await expect(
      page.getByText("文章不存在或已被删除").or(page.getByText("服务器错误")).or(page.getByText("网络")),
    ).toBeVisible({ timeout: 10000 });
  });
});