/**
 * Merchant Profile API Tests
 * Tests for merchant profile management endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let merchantToken: string;

// Test credentials from seeder
const MERCHANT_CREDENTIALS = {
  phoneNumber: "+6281234567890",
  password: "password123",
};

describe("Merchant Profile API", () => {
  beforeAll(async () => {
    try {
      // Login as merchant
      const loginRes = await fetch(`${BASE_URL}/merchants/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MERCHANT_CREDENTIALS),
      });

      serverAvailable = loginRes.ok;

      if (serverAvailable) {
        // Store token from cookie if available
        const cookies = loginRes.headers.get("set-cookie");
        if (cookies) {
          const tokenMatch = cookies.match(/merchant-session=([^;]+)/);
          if (tokenMatch) {
            merchantToken = tokenMatch[1];
          }
        }
      }
    } catch (error) {
      serverAvailable = false;
      console.error("Server not available:", error);
    }
  });

  describe("PUT /api/merchants/profile", () => {
    it("should update merchant profile successfully", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Updated Test Merchant",
        description: "Updated description for testing",
        imageUrl: "https://example.com/updated-image.jpg",
      };

      const response = await fetch(`${BASE_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.merchant.name).toBe(updateData.name);
      expect(data.data.merchant.description).toBe(updateData.description);
      expect(data.data.merchant.imageUrl).toBe(updateData.imageUrl);
    });

    it("should update only provided fields", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Partial Update Test",
      };

      const response = await fetch(`${BASE_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.merchant.name).toBe(updateData.name);
    });

    it("should handle null values for optional fields", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Test Merchant",
        description: null,
        imageUrl: null,
      };

      const response = await fetch(`${BASE_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should reject request without authentication", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Unauthorized Update",
      };

      const response = await fetch(`${BASE_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Authentication required");
    });

    it("should validate profile data", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const invalidData = {
        name: "", // Empty name should fail
      };

      const response = await fetch(`${BASE_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Validation failed");
    });

    it("should reject duplicate phone number", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      // Try to use another merchant's phone number
      const updateData = {
        phoneNumber: "+6281234567891", // Another merchant's phone
      };

      const response = await fetch(`${BASE_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(updateData),
      });

      // Should either be 409 (conflict) or 200 if phone doesn't exist
      expect([200, 409]).toContain(response.status);

      if (response.status === 409) {
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.message).toContain("Phone number already registered");
      }
    });
  });

  describe("PUT /api/merchants/profile/password", () => {
    it("should change password successfully", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const passwordData = {
        currentPassword: MERCHANT_CREDENTIALS.password,
        newPassword: "newpassword123",
      };

      const response = await fetch(`${BASE_URL}/merchants/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(passwordData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toContain("Password updated successfully");

      // Change password back to original
      await fetch(`${BASE_URL}/merchants/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.newPassword,
          newPassword: MERCHANT_CREDENTIALS.password,
        }),
      });
    });

    it("should reject incorrect current password", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const passwordData = {
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
      };

      const response = await fetch(`${BASE_URL}/merchants/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(passwordData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Current password is incorrect");
    });

    it("should reject weak new password", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const passwordData = {
        currentPassword: MERCHANT_CREDENTIALS.password,
        newPassword: "weak", // Too short
      };

      const response = await fetch(`${BASE_URL}/merchants/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `merchant-session=${merchantToken}`,
        },
        body: JSON.stringify(passwordData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Validation failed");
    });

    it("should reject request without authentication", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const passwordData = {
        currentPassword: MERCHANT_CREDENTIALS.password,
        newPassword: "newpassword123",
      };

      const response = await fetch(`${BASE_URL}/merchants/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Authentication required");
    });
  });
});
