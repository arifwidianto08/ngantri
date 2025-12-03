/**
 * E2E Tests: Shopping Cart Flow
 * Tests the complete shopping cart experience
 */

import { test, expect } from "@playwright/test";

test.describe("Shopping Cart", () => {
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

  test("should add item to cart from menu page", async ({ page }) => {
    // Click first merchant to see menus
    await page.locator("[data-testid='merchant-card']").first().click();
    await page.waitForTimeout(500);

    // Add first menu item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();
    await page.waitForTimeout(300);

    // Verify cart widget shows item count
    const cartCount = page.locator("[data-testid='cart-count']");
    await expect(cartCount).toBeVisible({ timeout: 5000 });
    await expect(cartCount).toHaveText("1");
  });

  test("should view cart items", async ({ page }) => {
    // Click first merchant
    await page.locator("[data-testid='merchant-card']").first().click();
    await page.waitForTimeout(500);

    // Add item to cart
    const addToCartBtn = page
      .locator("[data-testid='add-to-cart-btn']")
      .first();
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();
    await page.waitForTimeout(300);

    // Click cart widget to navigate to cart page
    await page.locator("[data-testid='cart-widget']").click();

    // Verify on cart page
    await expect(page).toHaveURL(/\/cart/);

    // Verify cart item is displayed
    const cartItem = page.locator("[data-testid='cart-item']");
    await expect(cartItem.first()).toBeVisible({ timeout: 5000 });
  });

  test("should update item quantity in cart", async ({ page }) => {
    // Add item to cart first
    await page.locator("[data-testid='merchant-card']").first().click();
    await page.waitForTimeout(500);
    await page.locator("[data-testid='add-to-cart-btn']").first().click();
    await page.waitForTimeout(300);

    // Navigate to cart page
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Increment quantity using + button (click it twice to make qty = 3)
    const incrementButtons = page.locator("button:has-text('+')");
    const firstIncrementButton = incrementButtons.first();
    await expect(firstIncrementButton).toBeVisible({ timeout: 5000 });
    await firstIncrementButton.click();
    await page.waitForTimeout(200);
    await firstIncrementButton.click();
    await page.waitForTimeout(200);

    // Verify item total is displayed
    const itemTotal = page.locator("[data-testid='item-total']").first();
    await expect(itemTotal).toBeVisible({ timeout: 5000 });
  });

  test("should remove item from cart", async ({ page }) => {
    // Add item to cart first
    await page.locator("[data-testid='merchant-card']").first().click();
    await page.waitForTimeout(500);
    await page.locator("[data-testid='add-to-cart-btn']").first().click();
    await page.waitForTimeout(300);

    // Navigate to cart page
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Verify item is in cart
    const cartItem = page.locator("[data-testid='cart-item']").first();
    await expect(cartItem).toBeVisible({ timeout: 5000 });

    // Remove item
    const removeBtn = page.locator("[data-testid='remove-item-btn']").first();
    await expect(removeBtn).toBeVisible({ timeout: 5000 });
    await removeBtn.click();
    await page.waitForTimeout(300);

    // Verify empty cart message appears
    const emptyMessage = page.locator("[data-testid='empty-cart-message']");
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });

  test("should clear entire cart", async ({ page }) => {
    // Add item to cart first
    await page.locator("[data-testid='merchant-card']").first().click();
    await page.waitForTimeout(500);
    await page.locator("[data-testid='add-to-cart-btn']").first().click();
    await page.waitForTimeout(300);

    // Navigate to cart page
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Click clear cart button (this triggers browser confirm dialog)
    const clearBtn = page.locator("[data-testid='clear-cart-btn']");
    await expect(clearBtn).toBeVisible({ timeout: 5000 });

    // Accept the browser confirmation dialog
    page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await clearBtn.click();
    await page.waitForTimeout(300);

    // Verify cart is empty
    const emptyMessage = page.locator("[data-testid='empty-cart-message']");
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });
});
