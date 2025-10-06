import { describe, it, expect } from "@jest/globals";

// Contract test for PUT /api/merchants/image
// This test MUST FAIL until the API route is implemented
describe("/api/merchants/image - Contract Tests", () => {
  const baseUrl = "http://localhost:3000";

  it("should upload merchant profile image when authenticated", async () => {
    // Create a mock image file
    const imageBuffer = Buffer.from("fake-image-data");
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([imageBuffer], { type: "image/jpeg" }),
      "profile.jpg"
    );

    const response = await fetch(`${baseUrl}/api/merchants/image`, {
      method: "PUT",
      headers: {
        Cookie: "session=mock-session-token",
      },
      body: formData,
    });

    // This test MUST FAIL until implementation is complete
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        image_url: expect.stringMatching(
          /^\/uploads\/merchants\/[a-f0-9-]+\.(jpg|jpeg|png|webp)$/
        ),
      },
    });
  });

  it("should return 401 when not authenticated", async () => {
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([Buffer.from("fake")], { type: "image/jpeg" }),
      "test.jpg"
    );

    const response = await fetch(`${baseUrl}/api/merchants/image`, {
      method: "PUT",
      body: formData,
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Unauthorized"),
    });
  });

  it("should return 400 for invalid file type", async () => {
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([Buffer.from("fake")], { type: "text/plain" }),
      "test.txt"
    );

    const response = await fetch(`${baseUrl}/api/merchants/image`, {
      method: "PUT",
      headers: {
        Cookie: "session=mock-session-token",
      },
      body: formData,
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("Invalid file type"),
    });
  });

  it("should return 400 for file too large", async () => {
    const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([largeBuffer], { type: "image/jpeg" }),
      "large.jpg"
    );

    const response = await fetch(`${baseUrl}/api/merchants/image`, {
      method: "PUT",
      headers: {
        Cookie: "session=mock-session-token",
      },
      body: formData,
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining("File too large"),
    });
  });
});
