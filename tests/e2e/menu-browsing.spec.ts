/**
 * E2E Tests: Menu Browsing
 * Tests customer menu browsing experience
 */

import { test, expect } from "@playwright/test";

test.describe("Menu Browsing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Fill out setup dialog
    await page.locator("#table").fill("1");
    await page.locator("#name").fill("Test Customer");
    await page.locator("#phone").fill("08123456789");

    // Submit the dialog
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState("networkidle");
  });

  test("should display merchants list", async ({ page }) => {
    // Wait for merchants to load
    const merchantCard = page.locator("[data-testid='merchant-card']");
    await expect(merchantCard.first()).toBeVisible({ timeout: 5000 });
  });

  test("should display menu items when merchant selected", async ({ page }) => {
    // Click first merchant
    await page.locator("[data-testid='merchant-card']").first().click();
    await page.waitForTimeout(500);

    // Verify menu items appear
    const menuItem = page.locator("[data-testid='menu-item']");
    const menuName = page.locator("[data-testid='menu-name']");
    const menuPrice = page.locator("[data-testid='menu-price']");

    await expect(menuItem.first()).toBeVisible({ timeout: 5000 });
    await expect(menuName.first()).toBeVisible({ timeout: 5000 });
    await expect(menuPrice.first()).toBeVisible({ timeout: 5000 });
  });
});
