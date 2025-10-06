import { describe, it, expect } from "@jest/globals";

// Contract test for POST /api/merchants/register
// This test MUST FAIL until the API route is implemented
describe("/api/merchants/register - Contract Tests", () => {
  const baseUrl = "http://localhost:3000";

  it("should register a new merchant with valid data", async () => {
    const requestBody = {
      phone_number: "+6281234567890",
      password: "securepassword123",
      name: "Nasi Gudeg Pak Joko",
      description: "Authentic Gudeg from Yogyakarta",
    };

    const response = await fetch(`${baseUrl}/api/merchants/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // This test MUST FAIL until implementation is complete
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        phone_number: requestBody.phone_number,
        name: requestBody.name,
        description: requestBody.description,
        merchant_number: expect.any(Number),
        image_url: null,
        is_available: true,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Verify UUID v7 format
    expect(data.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("should return 400 for missing required fields", async () => {
    const requestBody = {
      phone_number: "+6281234567890",
      // missing password and name
    };

    const response = await fetch(`${baseUrl}/api/merchants/register`, {
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

  it("should return 400 for invalid phone number format", async () => {
    const requestBody = {
      phone_number: "081234567890", // missing country code
      password: "securepassword123",
      name: "Nasi Gudeg Pak Joko",
    };

    const response = await fetch(`${baseUrl}/api/merchants/register`, {
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
      error: expect.stringContaining("phone_number"),
    });
  });
});
