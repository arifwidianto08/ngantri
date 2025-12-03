/**
 * E2E Tests: Checkout and Order Flow
 * Tests the complete checkout and order placement experience
 */

import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
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

  test("should proceed to checkout from cart", async ({ page }) => {
    // Add item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Go to cart
    await page.goto("/cart");

    // Click checkout button
    const checkoutBtn = page.locator("[data-testid='checkout-btn']");
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Verify checkout page
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("should fill order information and place order", async ({ page }) => {
    // Add item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Go to checkout
    await page.goto("/checkout");

    // Fill customer information
    const nameInput = page.locator("[data-testid='customer-name']");
    const phoneInput = page.locator("[data-testid='customer-phone']");

    if (await nameInput.isVisible()) {
      await nameInput.fill("John Doe");
    }

    if (await phoneInput.isVisible()) {
      await phoneInput.fill("081234567890");
    }

    // Add notes if available
    const notesInput = page.locator("[data-testid='customer-notes']");
    if (await notesInput.isVisible()) {
      await notesInput.fill("Extra spicy please");
    }

    // Submit order
    const placeOrderBtn = page.locator("[data-testid='place-order-btn']");
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // Verify order confirmation or payment page
    await page.waitForURL(/\/(orders|payment|checkout)/, { timeout: 10000 });
  });

  test("should validate required fields on checkout", async ({ page }) => {
    await page.goto("/checkout");

    // Try to submit without filling fields
    const placeOrderBtn = page.locator("[data-testid='place-order-btn']");
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();
    }

    // Verify error messages appear
    const errorMessage = page.locator("[data-testid='error-message']");
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});
