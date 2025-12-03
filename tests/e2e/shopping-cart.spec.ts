/**
 * E2E Tests: Shopping Cart Flow
 * Tests the complete shopping cart experience
 */

import { test, expect } from "@playwright/test";

test.describe("Shopping Cart", () => {
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

  test("should add item to cart from menu page", async ({ page }) => {
    // Navigate to a merchant/menu
    const menuButton = page.locator("[data-testid='menu-item']").first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    // Click add to cart button
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Verify cart widget shows updated count
    const cartCount = page.locator("[data-testid='cart-count']");
    await expect(cartCount).toHaveText(/1+/);
  });

  test("should view cart items", async ({ page }) => {
    // Add item to cart first
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Click cart widget to view cart
    await page.locator("[data-testid='cart-widget']").click();

    // Verify cart page is displayed
    await expect(page).toHaveURL(/\/cart/);
    const cartItem = page.locator("[data-testid='cart-item']").first();
    await expect(cartItem).toBeVisible();
  });

  test("should update item quantity in cart", async ({ page }) => {
    // Add item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Go to cart
    await page.goto("/cart");

    // Find quantity input and increase
    const quantityInput = page
      .locator("[data-testid='item-quantity-input']")
      .first();
    await quantityInput.fill("3");

    // Verify total is updated
    const itemTotal = page.locator("[data-testid='item-total']").first();
    await expect(itemTotal).toContainText(/Rp/);
  });

  test("should remove item from cart", async ({ page }) => {
    // Add item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Go to cart
    await page.goto("/cart");

    // Click remove button
    const removeBtn = page.locator("[data-testid='remove-item-btn']").first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
    }

    // Verify item is removed
    const cartItem = page.locator("[data-testid='cart-item']").first();
    await expect(cartItem).not.toBeVisible({ timeout: 5000 });
  });

  test("should clear entire cart", async ({ page }) => {
    // Add item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // Go to cart
    await page.goto("/cart");

    // Click clear cart button
    const clearBtn = page.locator("[data-testid='clear-cart-btn']");
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.locator("button:has-text('Confirm')").click();
    }

    // Verify cart is empty
    const emptyMessage = page.locator("[data-testid='empty-cart-message']");
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });
});
