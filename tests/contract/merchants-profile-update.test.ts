import { describe, it, expect } from "@jest/globals";

// Contract test for PUT /api/merchants/profile
// This test MUST FAIL until the API route is implemented
describe("/api/merchants/profile (PUT) - Contract Tests", () => {
  const baseUrl = "http://localhost:3000";

  it("should update merchant profile when authenticated", async () => {
    const requestBody = {
      name: "Updated Nasi Gudeg Pak Joko",
      description: "Best Gudeg in town with special recipes",
      is_available: false,
    };

    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "session=mock-session-token",
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
        phone_number: expect.any(String),
        name: requestBody.name,
        merchant_number: expect.any(Number),
        image_url: expect.any(String),
        description: requestBody.description,
        is_available: requestBody.is_available,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Verify UUID v7 format
    expect(data.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Verify updated_at is more recent than created_at
    const createdAt = new Date(data.data.created_at);
    const updatedAt = new Date(data.data.updated_at);
    expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
  });

  it("should return 401 when not authenticated", async () => {
    const requestBody = {
      name: "Updated Name",
    };

    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Unauthorized"),
    });
  });

  it("should return 400 for invalid data", async () => {
    const requestBody = {
      name: "", // invalid empty name
      description: "A".repeat(600), // exceeds 500 character limit
    };

    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "session=mock-session-token",
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

  it("should handle partial updates", async () => {
    const requestBody = {
      is_available: true, // only updating availability
    };

    const response = await fetch(`${baseUrl}/api/merchants/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "session=mock-session-token",
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        is_available: true,
        updated_at: expect.any(String),
      },
    });
  });
});
