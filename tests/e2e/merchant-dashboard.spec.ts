/**
 * E2E Tests: Merchant Dashboard
 * Tests merchant dashboard functionality
 */

import { test, expect } from "@playwright/test";

test.describe("Merchant Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as merchant
    await page.goto("/login");
    await page.fill("[data-testid='merchant-phone']", "+6281234567890");
    await page.fill("[data-testid='merchant-password']", "password123");
    await page.click("[data-testid='merchant-login-btn']");

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard($|\/)/);
    await page.waitForLoadState("networkidle");
  });

  test("should display merchant dashboard", async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard($|\/)/);
  });

  test("should be authenticated", async ({ page }) => {
    // Verify page loaded successfully (no redirect to login)
    const url = page.url();
    expect(url).toContain("/dashboard");
  });
});
