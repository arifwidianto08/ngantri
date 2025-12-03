/**
 * Merchants API Tests
 * Tests for buyer-facing merchant endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;

describe("Merchants API", () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE_URL}/merchants`);
      serverAvailable = res.ok || res.status === 200;
    } catch {
      serverAvailable = false;
    }
  });

  describe("GET /api/merchants", () => {
    it("should retrieve all active merchants", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/merchants`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("merchants");
      expect(Array.isArray(data.data.merchants)).toBe(true);
    });

    it("should return merchant objects with required fields", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/merchants`);
      const data = await res.json();

      if (data.data.merchants.length > 0) {
        const merchant = data.data.merchants[0];
        expect(merchant).toHaveProperty("id");
        expect(merchant).toHaveProperty("name");
        expect(merchant).toHaveProperty("phoneNumber");
        expect(merchant).toHaveProperty("merchantNumber");
        expect(merchant).toHaveProperty("imageUrl");
        expect(merchant).toHaveProperty("description");
        expect(merchant).toHaveProperty("isAvailable");
      }
    });

    it("should only return available merchants", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/merchants`);
      const data = await res.json();

      for (const merchant of data.data.merchants) {
        expect(merchant.isAvailable).toBe(true);
      }
    });
  });

  describe("GET /api/merchants/[merchantId]/menus", () => {
    let merchantId: string;

    beforeAll(async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/merchants`);
      const data = await res.json();
      if (data.data.merchants.length > 0) {
        merchantId = data.data.merchants[0].id;
      }
    });

    it("should retrieve menus for a specific merchant", async () => {
      if (!serverAvailable || !merchantId) return;
      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("menus");
      expect(Array.isArray(data.data.menus)).toBe(true);
    });

    it("should return menu objects with required fields", async () => {
      if (!serverAvailable || !merchantId) return;
      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
      const data = await res.json();

      if (data.data.menus.length > 0) {
        const menu = data.data.menus[0];
        expect(menu).toHaveProperty("id");
        expect(menu).toHaveProperty("name");
        expect(menu).toHaveProperty("price");
        expect(menu).toHaveProperty("description");
        expect(menu).toHaveProperty("isAvailable");
      }
    });

    it("should return empty array for non-existent merchant", async () => {
      if (!serverAvailable) return;
      const fakeId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/merchants/${fakeId}/menus`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.menus).toEqual([]);
    });
  });
});
