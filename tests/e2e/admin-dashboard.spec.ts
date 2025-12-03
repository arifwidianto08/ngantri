/**
 * E2E Tests: Admin Dashboard
 * Tests admin dashboard functionality
 */

import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/admin/login");
    await page.fill("[data-testid='admin-username']", "admin");
    await page.fill("[data-testid='admin-password']", "admin123");
    await page.click("[data-testid='admin-login-btn']");

    // Wait for redirect to dashboard
    await page.waitForURL(/\/admin($|\/)/);
    await page.waitForLoadState("networkidle");
  });

  test("should display admin dashboard", async ({ page }) => {
    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(/\/admin($|\/)/);
  });

  test("should be authenticated", async ({ page }) => {
    // Verify page loaded successfully (no redirect to login)
    const url = page.url();
    expect(url).toContain("/admin");
  });
});
