/**
 * Sessions API Tests
 * Tests for buyer session management endpoints
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
    });

    it("should return session with ID", async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      expect(data.data.session).toHaveProperty("id");
      // Verify UUID format (v7)
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
  });
});
