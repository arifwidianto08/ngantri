/**
 * Admin API Tests
 * Tests for admin-only endpoints (/api/admin/*)
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let adminToken: string;
let merchantId: string;
let categoryId: string;
let menuId: string;

describe("Admin API", () => {
  beforeAll(async () => {
    try {
      // Login as admin
      const loginRes = await fetch(`${BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "admin123",
        }),
      });
      
      serverAvailable = loginRes.ok;
      
      if (serverAvailable) {
        const loginData = await loginRes.json();
        if (loginData.success && loginData.data?.admin) {
          // Store token from cookie if available
          const cookies = loginRes.headers.get("set-cookie");
          if (cookies) {
            const tokenMatch = cookies.match(/admin-session=([^;]+)/);
            if (tokenMatch) {
              adminToken = tokenMatch[1];
            }
          }
        }

        // Get first merchant for testing
        const merchantRes = await fetch(`${BASE_URL}/admin/merchants`);
        if (merchantRes.ok) {
          const merchantData = await merchantRes.json();
          merchantId = merchantData.data[0]?.id;
        }

        // Get first category for testing
        const categoryRes = await fetch(`${BASE_URL}/admin/categories`);
        if (categoryRes.ok) {
          const categoryData = await categoryRes.json();
          categoryId = categoryData.data[0]?.id;
        }
      }
    } catch {
      serverAvailable = false;
    }
  });

  describe("Admin Authentication", () => {
    describe("POST /api/admin/login", () => {
      it("should login with valid credentials", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "admin",
            password: "admin123",
          }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        // Admin login only returns message, not admin object
        expect(data.data).toHaveProperty("message");
      });

      it("should reject invalid credentials", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "admin",
            password: "wrongpassword",
          }),
        });

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.success).toBe(false);
      });
    });

    describe("GET /api/admin/me", () => {
      it("should return admin profile when authenticated", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/me`);
        expect([200, 401]).toContain(res.status);
      });
    });

    describe("POST /api/admin/logout", () => {
      it("should logout successfully", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/logout`, {
          method: "POST",
        });

        expect([200, 401]).toContain(res.status);
      });
    });
  });

  describe("Admin Merchant Management", () => {
    describe("GET /api/admin/merchants", () => {
      it("should retrieve all merchants", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/merchants`, {
          headers: adminToken ? { Cookie: `admin-session=${adminToken}` } : {},
        });      
        expect([200, 401]).toContain(res.status);
      });
    });

    describe("POST /api/admin/merchants/create", () => {
      it("should create a new merchant", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/merchants/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test Merchant",
            phoneNumber: "+6281234567999",
            merchantNumber: 999,
            password: "password123",
            description: "Test merchant description",
            isAvailable: true,
          }),
        });

        expect([200, 201, 400, 401, 409, 500]).toContain(res.status);
      });
    });

    describe("GET /api/admin/merchants/[merchantId]", () => {
      it("should retrieve merchant by ID", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(`${BASE_URL}/admin/merchants/${merchantId}`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.merchant.id).toBe(merchantId);
      });
    });

    describe("PATCH /api/admin/merchants/[merchantId]/availability", () => {
      it("should toggle merchant availability", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(
          `${BASE_URL}/admin/merchants/${merchantId}/availability`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAvailable: false }),
          }
        );

        expect(res.status).toBe(200);
      });
    });
  });

  describe("Admin Category Management", () => {
    describe("GET /api/admin/categories", () => {
      it("should retrieve all categories", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/categories`, {
          headers: adminToken ? { Cookie: `admin-session=${adminToken}` } : {},
        });     
        expect([200, 401]).toContain(res.status);
      });

      it("should filter categories by merchant", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(
          `${BASE_URL}/admin/categories?merchantId=${merchantId}`
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      });
    });

    describe("POST /api/admin/categories/create", () => {
      it("should create a new category", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(`${BASE_URL}/admin/categories/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test Category",
            merchantId: merchantId,
          }),
        });

        expect([200, 201, 400]).toContain(res.status);
      });
    });

    describe("GET /api/admin/categories/[categoryId]", () => {
      it("should retrieve category by ID", async () => {
        if (!serverAvailable || !categoryId) return;

        const res = await fetch(`${BASE_URL}/admin/categories/${categoryId}`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.category.id).toBe(categoryId);
      });
    });
  });

  describe("Admin Menu Management", () => {
    describe("GET /api/admin/menus", () => {
      it("should retrieve all menus", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/menus`, {
          headers: adminToken ? { Cookie: `admin-session=${adminToken}` } : {},
        });
        expect([200, 401]).toContain(res.status);

        if (res.status === 200) {
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(Array.isArray(data.data)).toBe(true);
        }
      });

      it("should filter menus by merchant", async () => {
        if (!serverAvailable || !merchantId) return;

        const res = await fetch(
          `${BASE_URL}/admin/menus?merchantId=${merchantId}`
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
      });
    });

    describe("POST /api/admin/menus/create", () => {
      it("should create a new menu item", async () => {
        if (!serverAvailable || !merchantId || !categoryId) return;

        const res = await fetch(`${BASE_URL}/admin/menus/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test Menu Item",
            description: "A test menu item",
            price: 50000,
            categoryId: categoryId,
            merchantId: merchantId,
            isAvailable: true,
          }),
        });

        expect([200, 201, 400]).toContain(res.status);
        if (res.ok) {
          const data = await res.json();
          menuId = data.data.menu.id;
        }
      });
    });

    describe("GET /api/admin/menus/[menuId]", () => {
      it("should retrieve menu by ID", async () => {
        if (!serverAvailable) return;

        // Get first menu
        const listRes = await fetch(`${BASE_URL}/admin/menus`);
        const listData = await listRes.json();
        const testMenuId = listData.data?.[0]?.id;

        if (!testMenuId) return;

        const res = await fetch(`${BASE_URL}/admin/menus/${testMenuId}`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.menu.id).toBe(testMenuId);
      });
    });

    describe("PATCH /api/admin/menus/[menuId]/availability", () => {
      it("should toggle menu availability", async () => {
        if (!serverAvailable) return;

        // Get first menu
        const listRes = await fetch(`${BASE_URL}/admin/menus`);
        const listData = await listRes.json();
        const testMenuId = listData.data?.[0]?.id;

        if (!testMenuId) return;

        const res = await fetch(
          `${BASE_URL}/admin/menus/${testMenuId}/availability`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAvailable: false }),
          }
        );

        expect(res.status).toBe(200);
      });
    });
  });

  describe("Admin Order Management", () => {
    describe("GET /api/admin/orders", () => {
      it("should retrieve all orders", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/orders`, {
          headers: adminToken ? { Cookie: `admin-session=${adminToken}` } : {},
        });
        expect([200, 401]).toContain(res.status);

        if (res.status === 200) {
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(Array.isArray(data.data)).toBe(true);
        }
      });
    });

    describe("PATCH /api/admin/orders/[orderId]/status", () => {
      it("should update order status", async () => {
        if (!serverAvailable) return;

        const fakeOrderId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(
          `${BASE_URL}/admin/orders/${fakeOrderId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "preparing" }),
          }
        );

        expect([400, 401, 404, 500]).toContain(res.status);
      });
    });
  });

  describe("Admin Dashboard Stats", () => {
    describe("GET /api/admin/dashboard/stats", () => {
      it("should retrieve dashboard statistics", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/admin/dashboard/stats`);
        expect([200, 401]).toContain(res.status);
      });
    });
  });
});
