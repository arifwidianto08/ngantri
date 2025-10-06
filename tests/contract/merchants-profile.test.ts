import { describe, it, expect } from "@jest/globals";

// Contract test for GET /api/merchants/profile
// This test MUST FAIL until the API route is implemented
describe("/api/merchants/profile - Contract Tests", () => {
  const baseUrl = "http://localhost:3000";

  it("should get merchant profile when authenticated", async () => {
    // Mock session cookie (this would be set after login)
    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "GET",
      headers: {
        Cookie: "session=mock-session-token",
      },
    });

    // This test MUST FAIL until implementation is complete
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        phone_number: expect.any(String),
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

    // Verify phone number format
    expect(data.data.phone_number).toMatch(/^\+[1-9]\d{1,14}$/);
  });

  it("should return 401 when not authenticated", async () => {
    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "GET",
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Unauthorized"),
    });
  });

  it("should return 401 for invalid session token", async () => {
    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "GET",
      headers: {
        Cookie: "session=invalid-token",
      },
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Invalid session"),
    });
  });
});
