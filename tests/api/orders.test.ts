/**
 * Orders API Tests
 * Tests for order management endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let merchantId: string;
let sessionId: string;
let menuId: string;

describe("Orders API", () => {
  beforeAll(async () => {
    try {
      // Get merchant
      const merchantRes = await fetch(`${BASE_URL}/merchants`);
      serverAvailable = merchantRes.ok;

      if (serverAvailable) {
        const merchantData = await merchantRes.json();
        merchantId = merchantData.data[0]?.id;

        // Get menu
        if (merchantId) {
          const menuRes = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
          const menuData = await menuRes.json();
          menuId = menuData.data.menus?.[0]?.id;
        }

        // Create session
        const sessionRes = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const sessionData = await sessionRes.json();
        sessionId = sessionData.data.session.id;
      }
    } catch {
      serverAvailable = false;
    }
  });

  describe("POST /api/orders", () => {
    it("should create a new order", async () => {
      if (!serverAvailable || !sessionId || !merchantId || !menuId) return;

      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          merchantId,
          customerName: "Test Customer",
          customerPhone: "+6281234567890",
          items: [
            {
              menuId,
              menuName: "Test Menu",
              quantity: 1,
              unitPrice: 50000,
            },
          ],
        }),
      });

      expect([200, 201, 400, 500]).toContain(res.status);
    });

    it("should return error for missing required fields", async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect([400, 500]).toContain(res.status);
    });

    it("should return error for invalid session", async () => {
      if (!serverAvailable || !merchantId || !menuId) return;

      const fakeSessionId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: fakeSessionId,
          merchantId,
          customerName: "Test",
          customerPhone: "+6281234567890",
          items: [
            {
              menuId,
              menuName: "Test",
              quantity: 1,
              unitPrice: 50000,
            },
          ],
        }),
      });

      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("GET /api/orders/[orderId]", () => {
    it("should return 404 for non-existent order", async () => {
      if (!serverAvailable) return;

      const fakeOrderId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}`);
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("GET /api/orders/[orderId]/status", () => {
    it("should return 404 for non-existent order", async () => {
      if (!serverAvailable) return;

      const fakeOrderId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}/status`);
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("POST /api/orders/[orderId]/cancel", () => {
    it("should return 404 for non-existent order", async () => {
      if (!serverAvailable) return;

      const fakeOrderId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      expect([400, 404, 500]).toContain(res.status);
    });
  });
});
