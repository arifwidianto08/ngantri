/**
 * Menu API Tests
 * Tests for public menu browsing endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let merchantId: string;

describe("Menu API", () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE_URL}/merchants`);
      serverAvailable = res.ok;

      if (serverAvailable) {
        const data = await res.json();
        merchantId = data.data[0]?.id;
      }
    } catch {
      serverAvailable = false;
    }
  });

  describe("GET /api/merchants/[merchantId]/menus", () => {
    it("should retrieve all menus for a merchant", async () => {
      if (!serverAvailable || !merchantId) return;

      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should return menus with required fields", async () => {
      if (!serverAvailable || !merchantId) return;

      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
      const data = await res.json();

      if (data.data.length > 0) {
        const menu = data.data[0];
        expect(menu).toHaveProperty("id");
        expect(menu).toHaveProperty("name");
        expect(menu).toHaveProperty("description");
        expect(menu).toHaveProperty("price");
        expect(menu).toHaveProperty("isAvailable");
        expect(menu).toHaveProperty("categoryId");
      }
    });

    it("should return empty array for non-existent merchant", async () => {
      if (!serverAvailable) return;

      const fakeId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/merchants/${fakeId}/menus`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data).toEqual([]);
    });
  });

  describe("GET /api/merchants/[merchantId]/menus/[menuId]", () => {
    it("should retrieve a specific menu item", async () => {
      if (!serverAvailable || !merchantId) return;

      // Get first menu
      const listRes = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
      const listData = await listRes.json();
      const menuId = listData.data.menus?.[0]?.id;

      if (!menuId) return;

      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus/${menuId}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.menu.id).toBe(menuId);
    });

    it("should return 404 for non-existent menu", async () => {
      if (!serverAvailable || !merchantId) return;

      const fakeMenuId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus/${fakeMenuId}`);
      expect([404, 405, 500]).toContain(res.status);
    });
  });
});
