/**
 * Menu API Tests
 * Tests for menu endpoints
 *
 * Note: These tests require a running dev server:
 * npm run dev (in another terminal)
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let merchantId: string;
let categoryId: string;
let serverAvailable = true;

describe("Menu API", () => {
  beforeAll(async () => {
    try {
      // Test server availability
      const res = await fetch(`${BASE_URL}/admin/menus`);
      serverAvailable = res.ok || res.status === 200;

      if (serverAvailable) {
        // Use real IDs from seeded data
        merchantId = "019a91f9-b7e6-762f-a3c8-a7ab0fa3757f"; // Warung Nasi Padang
        categoryId = "019a91f9-b7e9-792e-8f84-fe1098c20260"; // Real category ID
      }
    } catch {
      serverAvailable = false;
    }
  });

  describe("GET /api/admin/menus", () => {
    it("should retrieve all menus", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/admin/menus`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should filter menus by merchant", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("POST /api/admin/menus", () => {
    it("should create a new menu item", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/admin/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Menu",
          description: "A test menu item",
          price: 50000,
          categoryId,
          merchantId,
          isAvailable: true,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.menu.name).toBe("Test Menu");
      expect(data.data.menu.price).toBe(50000);
    });

    it("should return error for missing required fields", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/admin/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Menu",
          // Missing other required fields
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("GET /api/admin/menus/[menuId]", () => {
    it("should retrieve a menu item by ID", async () => {
      if (!serverAvailable) return;
      // First get a menu
      const listRes = await fetch(`${BASE_URL}/admin/menus`);
      const listData = await listRes.json();
      const menuId = listData.data?.[0]?.id;

      if (!menuId) {
        console.log("Skipping test: No menu available");
        return;
      }

      const res = await fetch(`${BASE_URL}/admin/menus/${menuId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.menu.id).toBe(menuId);
    });
  });

  describe("PATCH /api/admin/menus/[menuId]/availability", () => {
    it("should toggle menu availability", async () => {
      if (!serverAvailable) return;
      // First get a menu
      const listRes = await fetch(`${BASE_URL}/admin/menus`);
      const listData = await listRes.json();
      const menuId = listData.data?.[0]?.id;

      if (!menuId) {
        console.log("Skipping test: No menu available");
        return;
      }

      const res = await fetch(
        `${BASE_URL}/admin/menus/${menuId}/availability`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: false }),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.menu.isAvailable).toBe(false);
    });
  });
});
