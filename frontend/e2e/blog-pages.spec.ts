import { test, expect } from "@playwright/test";

test.describe("分类页", () => {
  test("分类页加载正常", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("分类");
  });
});

test.describe("标签页", () => {
  test("标签页加载正常", async ({ page }) => {
    await page.goto("/tags");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("标签");
  });
});

test.describe("归档页", () => {
  test("归档页加载正常", async ({ page }) => {
    await page.goto("/archives");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("归档");
  });
});

test.describe("说说页", () => {
  test("说说页加载正常", async ({ page }) => {
    await page.goto("/talks");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("说说");
  });
});

test.describe("友链页", () => {
  test("友链页加载正常", async ({ page }) => {
    await page.goto("/links");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("链接");
  });
});

test.describe("留言页", () => {
  test("留言页加载正常且可提交留言", async ({ page }) => {
    await page.goto("/message");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("留言");
  });
});

test.describe("关于页", () => {
  test("关于页加载正常", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("关于");
  });
});