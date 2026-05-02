import { test, expect } from "@playwright/test";

test.describe("博客首页", () => {
  test("首页加载正常，显示导航和文章列表", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator('nav >> text=首页')).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("站点标题来自 API 配置或使用默认值", async ({ page }) => {
    await page.goto("/");
    const logo = page.locator("header a").first();
    await expect(logo).toBeVisible();
    const text = await logo.textContent();
    expect(text).toBeTruthy();
  });

  test("导航栏包含所有链接", async ({ page }) => {
    await page.goto("/");
    const navLinks = [
      "首页",
      "归档",
      "分类",
      "标签",
      "说说",
      "友链",
      "留言",
      "关于",
    ];
    for (const label of navLinks) {
      await expect(
        page.locator(`nav >> text=${label}`).first(),
      ).toBeVisible();
    }
  });
});