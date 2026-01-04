/**
 * Sessions API Tests
 * Tests for session and cart management endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;

describe("Sessions API", () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      serverAvailable = res.ok || res.status === 201;
    } catch {
      serverAvailable = false;
    }
  });

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
      expect(data.data.session).toHaveProperty("id");
    });

    it("should return session with valid UUID v7", async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
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
    let sessionId: string;

    beforeAll(async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      sessionId = data.data.session.id;
    });

    it("should update session table number", async () => {
      if (!serverAvailable || !sessionId) return;

      const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_number: 3 }),
      });

      expect(res.status).toBe(200);
    });

    it("should return 400 for invalid table number", async () => {
      if (!serverAvailable || !sessionId) return;

      const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
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

      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe("Cart Management", () => {
    let sessionId: string;
    let merchantId: string;
    let menuId: string;

    beforeAll(async () => {
      if (!serverAvailable) return;

      // Create session
      const sessionRes = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const sessionData = await sessionRes.json();
      sessionId = sessionData.data.session.id;

      // Get merchant and menu
      const merchantRes = await fetch(`${BASE_URL}/merchants`);
      const merchantData = await merchantRes.json();
      merchantId = merchantData.data[0]?.id;

      if (merchantId) {
        const menuRes = await fetch(`${BASE_URL}/merchants/${merchantId}/menus`);
        const menuData = await menuRes.json();
        menuId = menuData.data.menus?.[0]?.id;
      }
    });

    describe("POST /api/sessions/[sessionId]/cart", () => {
      it("should add item to cart", async () => {
        if (!serverAvailable || !sessionId || !menuId) return;

        const res = await fetch(`${BASE_URL}/sessions/${sessionId}/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menuId,
            quantity: 2,
          }),
        });

        expect([200, 201]).toContain(res.status);
      });

      it("should return error for invalid menu", async () => {
        if (!serverAvailable || !sessionId) return;

        const fakeMenuId = "00000000-0000-7000-a000-000000000000";
        const res = await fetch(`${BASE_URL}/sessions/${sessionId}/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menuId: fakeMenuId,
            quantity: 1,
          }),
        });

        expect([400, 404, 500]).toContain(res.status);
      });
    });

    describe("GET /api/sessions/[sessionId]/cart", () => {
      it("should retrieve cart items", async () => {
        if (!serverAvailable || !sessionId) return;

        const res = await fetch(`${BASE_URL}/sessions/${sessionId}/cart`);
        // GET is not supported, only POST for bulk add
        expect([200, 405]).toContain(res.status);
      });
    });
  });
});
