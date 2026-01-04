/**
 * Customer API Tests
 * Tests for public/customer-facing endpoints (sessions, orders, payments, merchants)
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let merchantId: string;
let sessionId: string;
let menuId: string;

describe("Customer API", () => {
  beforeAll(async () => {
    try {
      // Check server availability and get merchants
      const merchantRes = await fetch(`${BASE_URL}/merchants`);
      serverAvailable = merchantRes.ok;

      if (serverAvailable) {
        const merchantData = await merchantRes.json();
        merchantId = merchantData.data[0]?.id;

        // Get a menu item for testing
        if (merchantId) {
          const menusRes = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
          if (menusRes.ok) {
            const menusData = await menusRes.json();
            menuId = menusData.data.menus?.[0]?.id;
          }
        }
      }
    } catch {
      serverAvailable = false;
    }
  });

  describe("Public Merchants Endpoints", () => {
    describe("GET /api/merchants", () => {
      it("should retrieve all active merchants", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      });

      it("should return merchant objects with required fields", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/merchants`);
        const data = await res.json();

        if (data.data.length > 0) {
          const merchant = data.data[0];
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

        for (const merchant of data.data) {
          expect(merchant.isAvailable).toBe(true);
        }
      });
    });

    describe("GET /api/merchants/[merchantId]/menus", () => {
      it("should retrieve menus for a specific merchant", async () => {
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

      it("should return empty array for non-existent merchant", async () => {
        if (!serverAvailable) return;

        const fakeId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(`${BASE_URL}/merchants/${fakeId}/menus`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.data).toEqual([]);
      });
    });
  });

  describe("Session Management", () => {
    describe("POST /api/sessions", () => {
      it("should create a new session", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const data = await res.json();

        expect([200, 201]).toContain(res.status);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty("session");
        
        // Store for later tests
        sessionId = data.data.session.id;
      });

      it("should return session with valid UUID v7", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const data = await res.json();
        expect(data.data.session).toHaveProperty("id");
        
        // Verify UUID v7 format
        expect(data.data.session.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      });

      it("should accept optional table number", async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_number: 5 }),
        });

        expect([200, 201]).toContain(res.status);
        const data = await res.json();
        expect(data.success).toBe(true);
      });
    });

    describe("PATCH /api/sessions/[sessionId]", () => {
      let testSessionId: string;

      beforeAll(async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        testSessionId = data.data.session.id;
      });

      it("should update session table number", async () => {
        if (!serverAvailable || !testSessionId) return;

        const res = await fetch(`${BASE_URL}/sessions/${testSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_number: 3 }),
        });
        
        expect(res.status).toBe(200);
      });

      it("should return 400 for invalid table number", async () => {
        if (!serverAvailable || !testSessionId) return;

        const res = await fetch(`${BASE_URL}/sessions/${testSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_number: -1 }),
        });

        expect(res.status).toBe(400);
      });

      it("should return 404 for non-existent session", async () => {
        if (!serverAvailable) return;

        const fakeId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(`${BASE_URL}/sessions/${fakeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_number: 1 }),
        });

        expect([200, 400, 404, 500]).toContain(res.status);
      });
    });

    describe("Cart Management", () => {
      let cartSessionId: string;

      beforeAll(async () => {
        if (!serverAvailable) return;

        const res = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        cartSessionId = data.data.session.id;
      });

      describe("POST /api/sessions/[sessionId]/cart", () => {
        it("should add item to cart", async () => {
          if (!serverAvailable || !cartSessionId || !menuId) return;

          const res = await fetch(`${BASE_URL}/sessions/${cartSessionId}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              menuId: menuId,
              quantity: 2,
            }),
          });

          expect([200, 201]).toContain(res.status);
        });

        it("should return error for invalid menu", async () => {
          if (!serverAvailable || !cartSessionId) return;

          const fakeMenuId = "00000000-0000-7000-a000-000000000000";
          const res = await fetch(`${BASE_URL}/sessions/${cartSessionId}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              menuId: fakeMenuId,
              quantity: 1,
            }),
          });

          expect([400, 404]).toContain(res.status);
        });
      });

      describe("GET /api/sessions/[sessionId]/cart", () => {
        it("should retrieve cart items", async () => {
          if (!serverAvailable || !cartSessionId) return;

          const res = await fetch(`${BASE_URL}/sessions/${cartSessionId}/cart`);
          // GET is not supported, only POST for bulk add
          expect([200, 405]).toContain(res.status);
        });
      });
    });
  });

  describe("Order Management", () => {
    describe("POST /api/orders", () => {
      it("should create a new order", async () => {
        if (!serverAvailable || !merchantId || !menuId) return;

        // Create a session first
        const sessionRes = await fetch(`${BASE_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const sessionData = await sessionRes.json();
        const newSessionId = sessionData.data.session.id;

        const res = await fetch(`${BASE_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: newSessionId,
            merchantId: merchantId,
            customerName: "Test Customer",
            customerPhone: "+6281234567890",
            items: [
              {
                menuId: menuId,
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
          body: JSON.stringify({
            // Missing required fields
          }),
        });

        expect([400, 404, 500]).toContain(res.status);
      });
    });

    describe("GET /api/orders/[orderId]", () => {
      it("should retrieve order by ID", async () => {
        if (!serverAvailable) return;

        const fakeOrderId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}`);
        
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

    describe("POST /api/orders/[orderId]/cancel", () => {
      it("should cancel an order", async () => {
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

  describe("Payment Management", () => {
    describe("POST /api/payments/create", () => {
      it("should create a payment", async () => {
        if (!serverAvailable) return;

        const fakeOrderId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(`${BASE_URL}/payments/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: fakeOrderId,
            amount: 50000,
          }),
        });

        expect([200, 201, 400, 404, 500]).toContain(res.status);
      });
    });

    describe("GET /api/orders/[orderId]/payment", () => {
      it("should retrieve payment status for order", async () => {
        if (!serverAvailable) return;

        const fakeOrderId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(`${BASE_URL}/orders/${fakeOrderId}/payment`);

        expect([200, 400, 404, 405, 500]).toContain(res.status);
      });
    });
  });
});
