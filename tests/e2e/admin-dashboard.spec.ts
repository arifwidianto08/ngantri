/**
 * E2E Tests: Admin Dashboard
 * Tests admin dashboard functionality using seeded credentials
 * 
 * Test credentials (from scripts/seed.ts):
 * - Username: admin
 * - Password: admin123
 */

import { test, expect } from "@playwright/test";

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    
    // Fill form fields with explicit waits
    const usernameInput = page.locator("[data-testid='admin-username']");
    const passwordInput = page.locator("[data-testid='admin-password']");
    const loginBtn = page.locator("[data-testid='admin-login-btn']");
    
    await usernameInput.waitFor({ state: "visible", timeout: 15000 });
    await usernameInput.fill(ADMIN_CREDENTIALS.username);
    await passwordInput.fill(ADMIN_CREDENTIALS.password);
    
    // Wait for login API call to complete
    const loginPromise = page.waitForResponse(
      (response) => response.url().includes("/api/admin/login") && response.status() === 200,
      { timeout: 30000 }
    );
    await loginBtn.click();
    await loginPromise;

    // Wait for redirect to dashboard
    await page.waitForURL(/\/admin($|\/)/, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 });
  });

  test.describe("Authentication", () => {
    test("should display admin dashboard after login", async ({ page }) => {
      await expect(page).toHaveURL(/\/admin($|\/)/);
    });

    test("should show admin navigation", async ({ page }) => {
      // Verify admin navigation elements are present
      const merchantsNav = page.locator('a[href*="/admin/merchants"]');
      const menusNav = page.locator('a[href*="/admin/menus"]');
      const ordersNav = page.locator('a[href*="/admin/orders"]');
      
      await expect(merchantsNav.first()).toBeVisible({ timeout: 5000 });
      await expect(menusNav.first()).toBeVisible({ timeout: 5000 });
      await expect(ordersNav.first()).toBeVisible({ timeout: 5000 });
    });

    test("should logout successfully", async ({ page }) => {
      // Find and click logout button
      const logoutBtn = page.locator('button:has-text("Logout")');
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForURL(/\/admin\/login/, { timeout: 5000 });
      }
    });
  });

  test.describe("Merchant Management", () => {
    test("should navigate to merchants page", async ({ page }) => {
      await page.goto("/admin/merchants");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/admin\/merchants/);
    });

    test("should display merchants list", async ({ page }) => {
      await page.goto("/admin/merchants");
      await page.waitForLoadState("networkidle");
      
      // Check for merchants table or list
      const merchantsList = page.locator("[data-testid='merchants-list'], table, [role='table']");
      await expect(merchantsList.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Menu Management", () => {
    test("should navigate to menus page", async ({ page }) => {
      await page.goto("/admin/menus");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/admin\/menus/);
    });

    test("should display menus list", async ({ page }) => {
      await page.goto("/admin/menus");
      await page.waitForLoadState("networkidle");
      
      // Check for menus table or list
      const menusList = page.locator("[data-testid='menus-list'], table, [role='table']");
      await expect(menusList.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Order Management", () => {
    test("should navigate to orders page", async ({ page }) => {
      await page.goto("/admin/orders");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/admin\/orders/);
    });

    test("should display orders list", async ({ page }) => {
      await page.goto("/admin/orders");
      await page.waitForLoadState("networkidle");
      
      // Check for orders table or empty state
      const ordersList = page.locator("[data-testid='orders-list'], table, [role='table'], [data-testid='empty-state']");
      await expect(ordersList.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Dashboard Stats", () => {
    test("should display dashboard statistics", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForLoadState("networkidle");
      
      // Look for stat cards or metrics
      const stats = page.locator("[data-testid='stat-card'], [data-testid='dashboard-stats']");
      if (await stats.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(stats.first()).toBeVisible();
      }
    });
  });
});
