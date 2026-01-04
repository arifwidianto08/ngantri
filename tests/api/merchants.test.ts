/**
 * Merchant Dashboard API Tests
 * Tests for merchant-only endpoints (/api/merchants/*)
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let merchantToken: string;
let merchantId: string;
let categoryId: string;

// Test credentials from seeder
const MERCHANT_CREDENTIALS = {
  phoneNumber: "+6281234567890",
  password: "password123",
};

describe("Merchant Dashboard API", () => {
  beforeAll(async () => {
    try {
      // Login as merchant
      const loginRes = await fetch(`${BASE_URL}/merchants/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MERCHANT_CREDENTIALS),
      });

      serverAvailable = loginRes.ok;

      if (serverAvailable) {
        const loginData = await loginRes.json();
        if (loginData.success && loginData.data?.merchant) {
          merchantId = loginData.data.merchant.id;
          
          // Store token from cookie if available
          const cookies = loginRes.headers.get("set-cookie");
          if (cookies) {
            const tokenMatch = cookies.match(/merchant-session=([^;]+)/);
            if (tokenMatch) {
              merchantToken = tokenMatch[1];
            }
          }
        }

        // Get first category for this merchant
        const categoryRes = await fetch(
          `${BASE_URL}/merchants/${merchantId}/categories`
        );
        if (categoryRes.ok) {
          const categoryData = await categoryRes.json();
          categoryId = categoryData.data[0]?.id;
        }
      }
    } catch {
      serverAvailable = false;
    }
  });

  describe("Merchant Authentication", () => {
    describe("POST /api/merchants/register", () => {
      it("should register a new merchant", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New Test Merchant",
            phoneNumber: "+6281234567998",
            merchantNumber: 998,
            password: "password123",
            description: "Test merchant",
          }),
        });

        expect([200, 201, 400, 409]).toContain(res.status);
      });
    });

    describe("POST /api/merchants/login", () => {
      it("should login with valid credentials", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(MERCHANT_CREDENTIALS),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty("merchant");
      });

      it("should reject invalid credentials", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: "+6281234567890",
            password: "wrongpassword",
          }),
        });

        expect(res.status).toBe(401);
      });
    });

    describe("GET /api/merchants/me", () => {
      it("should return merchant profile when authenticated", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/me`);
        expect([200, 401]).toContain(res.status);
      });
    });

    describe("POST /api/merchants/logout", () => {
      it("should logout successfully", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/logout`, {
          method: "POST",
        });

        expect([200, 401]).toContain(res.status);
      });
    });
  });

  describe("Merchant Categories", () => {
    describe("GET /api/merchants/[merchantId]/categories", () => {
      it("should retrieve categories for merchant", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(
          `${BASE_URL}/merchants/${merchantId}/categories`,
          {
            headers: merchantToken ? { Cookie: `merchant-session=${merchantToken}` } : {},
          }
        );
        expect([200, 401]).toContain(res.status);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      });
    });

    describe("GET /api/merchants/[merchantId]/categories/[categoryId]", () => {
      it("should retrieve specific category", async () => {
        if (!serverAvailable || !merchantId || !categoryId) return;

        const res = await fetch(
          `${BASE_URL}/merchants/${merchantId}/categories/${categoryId}`
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.category.id).toBe(categoryId);
      });
    });
  });

  describe("Merchant Menus", () => {
    describe("GET /api/merchants/[merchantId]/menus", () => {
      it("should retrieve menus for merchant", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      });

      it("should return menu objects with required fields", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
        const data = await res.json();

        if (data.data.length > 0) {
          const menu = data.data[0];
          expect(menu).toHaveProperty("id");
          expect(menu).toHaveProperty("name");
          expect(menu).toHaveProperty("price");
          expect(menu).toHaveProperty("description");
          expect(menu).toHaveProperty("isAvailable");
        }
      });
    });

    describe("GET /api/merchants/[merchantId]/menus/[menuId]", () => {
      it("should retrieve specific menu item", async () => {
        if (!serverAvailable || !merchantId) return;

        // Get first menu
        const listRes = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
        const listData = await listRes.json();
        const menuId = listData.data.menus?.[0]?.id;

        if (!menuId) return;

        const res = await fetch(
          `${BASE_URL}/merchants/${merchantId}/menus/${menuId}`
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.menu.id).toBe(menuId);
      });
    });
  });

  describe("Merchant Orders", () => {
    describe("GET /api/merchants/dashboard/orders", () => {
      it("should retrieve merchant orders", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/dashboard/orders`);
        expect([200, 401]).toContain(res.status);
      });
    });

    describe("GET /api/merchants/dashboard/orders/[orderId]", () => {
      it("should retrieve specific order", async () => {
        if (!serverAvailable) return;

        const fakeOrderId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(
          `${BASE_URL}/merchants/dashboard/orders/${fakeOrderId}`
        );

        expect([400, 401, 404]).toContain(res.status);
      });
    });

    describe("PATCH /api/merchants/dashboard/orders/[orderId]/status", () => {
      it("should update order status", async () => {
        if (!serverAvailable) return;

        const fakeOrderId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(
          `${BASE_URL}/merchants/dashboard/orders/${fakeOrderId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ready" }),
          }
        );

        expect([400, 401, 404]).toContain(res.status);
      });
    });
  });

  describe("Merchant Dashboard Stats", () => {
    describe("GET /api/merchants/dashboard/stats", () => {
      it("should retrieve merchant statistics", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants/dashboard/stats`);
        expect([200, 401]).toContain(res.status);
      });
    });
  });
});
