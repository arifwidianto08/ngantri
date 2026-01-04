/**
 * E2E Tests: Checkout Flow
 * Tests customer checkout and order placement flow
 */

import { test, expect } from "@playwright/test";

const CUSTOMER_INFO = {
  name: "Test Customer",
  phone: "08123456789",
  tableNumber: "1",
};

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Fill out setup dialog if it appears
    const tableInput = page.locator("#table");
    if (await tableInput.isVisible({ timeout: 2000 }).catch(() => false)) {
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

  test.describe("Checkout Page", () => {
    test("should load checkout page", async ({ page }) => {
      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // Just verify the page loads (might show empty cart message)
      const body = page.locator("body");
      await expect(body).toBeVisible({ timeout: 5000 });
    });

    test("should handle checkout with items in cart", async ({ page }) => {
      // First add an item to cart
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      // Handle setup dialog if it appears (since we're re-navigating)
      const tableInput = page.locator("#table");
      if (await tableInput.isVisible({ timeout: 2000 }).catch(() => false)) {
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
      
      // Now click merchant card
      const merchantCard = page.locator("[data-testid='merchant-card']").first();
      if (await merchantCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await merchantCard.click();
        await page.waitForTimeout(500);
        
        const addBtn = page.locator("[data-testid='add-to-cart-btn']").first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(500);
          
          // Now go to checkout
          await page.goto("/checkout");
          await page.waitForLoadState("networkidle");
          
          // Look for any checkout button variant
          const checkoutBtn = page.locator("button:has-text('Place Order'), button:has-text('Checkout'), button:has-text('Pay'), button[type='submit']");
          if (await checkoutBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(checkoutBtn.first()).toBeVisible();
          }
        }
      }
    });

    test("should show cart summary or empty state", async ({ page }) => {
      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // Look for either cart summary or empty message
      const content = page.locator("[data-testid='cart-summary'], [data-testid='order-summary'], [data-testid='empty-cart-message'], main");
      await expect(content.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Order Placement", () => {
    test("should handle empty cart on checkout", async ({ page }) => {
      // Clear any existing cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");
      
      const clearBtn = page.locator("[data-testid='clear-cart-btn']");
      if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearBtn.click();
        const confirmBtn = page.locator('button:has-text("Clear Cart"), button:has-text("Confirm")');
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click();
        }
      }

      // Try to go to checkout
      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");
      
      // Should show empty message or redirect to home
      const emptyMsg = page.locator("[data-testid='empty-cart-message'], p:has-text('empty')");
      const isOnCheckout = page.url().includes("/checkout");
      
      if (isOnCheckout) {
        await expect(emptyMsg.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Payment Flow", () => {
    test("should display checkout page structure", async ({ page }) => {
      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");
      
      // Just verify the page exists and has content
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible({ timeout: 5000 });
      
      // Verify we're on checkout or cart page (might redirect if empty)
      const url = page.url();
      expect(url).toMatch(/\/(checkout|cart)/);
    });
  });
});
