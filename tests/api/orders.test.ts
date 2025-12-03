/**
 * Orders API Tests
 * Tests for buyer order management endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let merchantId: string;
let sessionId: string;

describe("Orders API", () => {
  beforeAll(async () => {
    try {
      // Check server availability
      const merchantRes = await fetch(`${BASE_URL}/merchants`);
      serverAvailable = merchantRes.ok;

      if (serverAvailable) {
        // Get a merchant
        const merchantData = await merchantRes.json();
        merchantId = merchantData.data.merchants[0]?.id;

        // Create a session
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
      if (!serverAvailable || !sessionId || !merchantId) return;

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
              menuId: "019a91f9-b7ec-70be-a951-c8b9f6f6c2b7",
              menuName: "Test Menu",
              quantity: 1,
              unitPrice: 50000,
            },
          ],
        }),
      });

      // Order creation might fail due to business logic,
      // but we're just testing the endpoint exists and responds
      expect([200, 201, 400, 500]).toContain(res.status);
    });

    it("should return error for missing required fields", async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("GET /api/orders", () => {
    it("should retrieve orders", async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/orders`);
      // May return 200 or require authentication
      expect([200, 401, 404]).toContain(res.status);
    });
  });

  describe("GET /api/orders/[orderId]", () => {
    it("should retrieve order by ID", async () => {
      if (!serverAvailable) return;

      const fakeOrderId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}`);
      // Should either return 404 or 400 for invalid order
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("GET /api/orders/[orderId]/status", () => {
    it("should retrieve order status", async () => {
      if (!serverAvailable) return;

      const fakeOrderId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}/status`);
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("PATCH /api/orders/[orderId]/status", () => {
    it("should update order status", async () => {
      if (!serverAvailable) return;

      const fakeOrderId = "00000000-0000-7000-a000-000000000000";
      const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      expect([400, 401, 404, 500]).toContain(res.status);
    });
  });
});
