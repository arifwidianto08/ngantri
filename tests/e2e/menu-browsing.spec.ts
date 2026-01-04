/**
 * E2E Tests: Menu Browsing
 * Tests customer menu browsing and merchant selection experience
 * Uses seeded merchants: Warung Nasi Padang & Bakso Malang
 */

import { test, expect } from "@playwright/test";

const CUSTOMER_INFO = {
  name: "Test Customer",
  phone: "08123456789",
  tableNumber: "3",
};

test.describe("Menu Browsing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Fill out setup dialog if it appears
    const tableInput = page.locator("#table");
    if (await tableInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableInput.waitFor({ state: "visible" });
      await tableInput.fill(CUSTOMER_INFO.tableNumber);
      await page.locator("#name").fill(CUSTOMER_INFO.name);
      await page.locator("#phone").fill(CUSTOMER_INFO.phone);
      
      // Wait for session PATCH to complete
      const sessionPromise = page.waitForResponse(
        (response) => response.url().includes("/api/sessions") && response.request().method() === "PATCH",
        { timeout: 10000 }
      );
      await page.locator('button[type="submit"]').click();
      await sessionPromise;
      await page.waitForLoadState("networkidle");
    }
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
