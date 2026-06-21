import { test, expect } from "@playwright/test";

test.describe("认证流程", () => {
  test("应该显示登录页面", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未登录用户访问首页应该重定向到登录页", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("登录页面应该包含邮箱和密码输入框", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="密码"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("登录页面应该包含提交按钮", async ({ page }) => {
    await page.goto("/login");
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});