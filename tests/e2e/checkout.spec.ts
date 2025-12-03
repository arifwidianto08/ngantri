import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
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

  test("should load checkout page with form fields", async ({ page }) => {
    await page.goto("/checkout");

    // Verify customer name and phone fields exist
    const customerName = page.locator("[data-testid='customer-name']");
    const customerPhone = page.locator("[data-testid='customer-phone']");
    const placeOrderBtn = page.locator("[data-testid='place-order-btn']");

    await expect(customerName).toBeVisible({ timeout: 5000 });
    await expect(customerPhone).toBeVisible({ timeout: 5000 });
    await expect(placeOrderBtn).toBeVisible({ timeout: 5000 });
  });
});
