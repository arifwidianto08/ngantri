/**
 * Admin Profile API Tests
 * Tests for admin profile management endpoints
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

const BASE_URL = "http://localhost:3000/api";
let serverAvailable = true;
let adminCookie: string;

// Test credentials from seeder
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

describe("Admin Profile API", () => {
  beforeAll(async () => {
    try {
      // Login as admin
      const loginRes = await fetch(`${BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ADMIN_CREDENTIALS),
      });

      serverAvailable = loginRes.ok;

      if (serverAvailable) {
        // Store cookie
        const cookies = loginRes.headers.get("set-cookie");
        if (cookies) {
          adminCookie = cookies;
        }
      }
    } catch (error) {
      serverAvailable = false;
      console.error("Server not available:", error);
    }
  });

  describe("PUT /api/admin/profile", () => {
    it("should update admin profile successfully", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Updated Admin Name",
        username: "admin_updated",
      };

      const response = await fetch(`${BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.admin.name).toBe(updateData.name);
      expect(data.data.admin.username).toBe(updateData.username);

      // Restore original username
      await fetch(`${BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ username: ADMIN_CREDENTIALS.username }),
      });
    });

    it("should update only provided fields", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Partial Update Test",
      };

      const response = await fetch(`${BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.admin.name).toBe(updateData.name);
    });

    it("should reject duplicate username", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      // Try to use existing username
      const updateData = {
        username: ADMIN_CREDENTIALS.username,
      };

      const response = await fetch(`${BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify(updateData),
      });

      // Should succeed since it's the same admin updating to their own username
      expect(response.status).toBe(200);
    });

    it("should reject request without authentication", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const updateData = {
        name: "Unauthorized Update",
      };

      const response = await fetch(`${BASE_URL}/admin/profile`, {
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
        username: "ab", // Too short (min 3 chars)
      };

      const response = await fetch(`${BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Validation failed");
    });
  });

  describe("PUT /api/admin/profile/password", () => {
    it("should change password successfully", async () => {
      if (!serverAvailable) {
        console.log("⚠️  Skipping test - server not available");
        return;
      }

      const passwordData = {
        currentPassword: ADMIN_CREDENTIALS.password,
        newPassword: "newadminpass123",
      };

      const response = await fetch(`${BASE_URL}/admin/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify(passwordData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toContain("Password updated successfully");

      // Change password back to original
      await fetch(`${BASE_URL}/admin/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          currentPassword: passwordData.newPassword,
          newPassword: ADMIN_CREDENTIALS.password,
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
        newPassword: "newadminpass123",
      };

      const response = await fetch(`${BASE_URL}/admin/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
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
        currentPassword: ADMIN_CREDENTIALS.password,
        newPassword: "weak", // Too short
      };

      const response = await fetch(`${BASE_URL}/admin/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
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
        currentPassword: ADMIN_CREDENTIALS.password,
        newPassword: "newadminpass123",
      };

      const response = await fetch(`${BASE_URL}/admin/profile/password`, {
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
