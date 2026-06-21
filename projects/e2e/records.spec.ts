import { test, expect } from "@playwright/test";

test.describe("页面可访问性", () => {
  test("登录页面应该正常加载", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("登录页面应该有正确的标题", async ({ page }) => {
    await page.goto("/login");
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("登录页面不应用 500 错误", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).not.toBe(500);
  });

  test("静态资源应该正常加载", async ({ page }) => {
    await page.goto("/login");
    const styles = await page.evaluate(() => {
      return document.styleSheets.length > 0 || document.querySelectorAll("link[rel=stylesheet]").length > 0;
    });
    expect(styles).toBeTruthy();
  });
});