import { describe, it, expect } from "@jest/globals";

// Contract test for POST /api/merchants/login
// This test MUST FAIL until the API route is implemented
describe("/api/merchants/login - Contract Tests", () => {
  const baseUrl = "http://localhost:3000";

  it("should authenticate merchant with valid credentials", async () => {
    const requestBody = {
      phone_number: "+6281234567890",
      password: "securepassword123",
    };

    const response = await fetch(`${baseUrl}/api/merchants/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // This test MUST FAIL until implementation is complete
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        phone_number: requestBody.phone_number,
        name: expect.any(String),
        merchant_number: expect.any(Number),
        image_url: expect.any(String),
        description: expect.any(String),
        is_available: expect.any(Boolean),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Verify UUID v7 format
    expect(data.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Verify session cookie is set
    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("session");
  });

  it("should return 401 for invalid credentials", async () => {
    const requestBody = {
      phone_number: "+6281234567890",
      password: "wrongpassword",
    };

    const response = await fetch(`${baseUrl}/api/merchants/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Invalid credentials"),
    });
  });

  it("should return 400 for missing required fields", async () => {
    const requestBody = {
      phone_number: "+6281234567890",
      // missing password
    };

    const response = await fetch(`${baseUrl}/api/merchants/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.any(String),
    });
  });

  it("should return 401 for non-existent phone number", async () => {
    const requestBody = {
      phone_number: "+6287654321098",
      password: "somepassword",
    };

    const response = await fetch(`${baseUrl}/api/merchants/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Invalid credentials"),
    });
  });
});
