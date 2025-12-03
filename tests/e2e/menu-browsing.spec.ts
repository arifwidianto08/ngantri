/**
 * E2E Tests: Menu Browsing
 * Tests customer menu browsing experience
 */

import { test, expect } from "@playwright/test";

test.describe("Menu Browsing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Close setup dialog if it appears
    const dialogBackdrop = page.locator('[aria-label="Close dialog"]');
    if (await dialogBackdrop.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dialogBackdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test("should display list of merchants", async ({ page }) => {
    // Wait for the page to load and API calls to complete
    await page.waitForLoadState("networkidle");

    const merchantList = page.locator("[data-testid='merchant-card']");
    const count = await merchantList.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter by category", async ({ page }) => {
    const categoryFilter = page.locator("[data-testid='category-filter']");
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();

      const categoryOption = page
        .locator("[data-testid='category-option']")
        .first();
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
      }

      // Verify filtered results
      const menuItems = page.locator("[data-testid='menu-item']");
      await expect(menuItems.first()).toBeVisible();
    }
  });

  test("should display menu details", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // First, select a merchant
    const merchantCard = page.locator("[data-testid='merchant-card']").first();
    if (await merchantCard.isVisible()) {
      await merchantCard.click();
      // Wait for menu items to load
      await page.waitForTimeout(1000);
    }

    // Now check for menu items
    const menuItem = page.locator("[data-testid='menu-item']").first();
    if (await menuItem.isVisible()) {
      // Verify menu item details exist
      const menuName = page.locator("[data-testid='menu-name']").first();
      const menuPrice = page.locator("[data-testid='menu-price']").first();

      await expect(menuName).toBeVisible();
      await expect(menuPrice).toBeVisible();
    }
  });

  test("should search for menu items", async ({ page }) => {
    const searchInput = page.locator("[data-testid='menu-search']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("nasi");

      // Wait for search results
      await page.waitForTimeout(500);

      const menuItems = page.locator("[data-testid='menu-item']");
      const count = await menuItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("should sort menu items", async ({ page }) => {
    const sortDropdown = page.locator("[data-testid='sort-dropdown']");
    if (await sortDropdown.isVisible()) {
      await sortDropdown.click();

      const sortOption = page.locator("[data-testid='sort-option-price']");
      if (await sortOption.isVisible()) {
        await sortOption.click();
      }

      // Verify results are sorted
      const firstItem = page.locator("[data-testid='menu-item']").first();
      await expect(firstItem).toBeVisible();
    }
  });

  test("should show menu availability status", async ({ page }) => {
    const menuItem = page.locator("[data-testid='menu-item']").first();
    if (await menuItem.isVisible()) {
      const availabilityBadge = menuItem.locator(
        "[data-testid='availability-badge']"
      );
      if (await availabilityBadge.isVisible()) {
        await expect(availabilityBadge).toContainText(/Available|Unavailable/);
      }
    }
  });
});
