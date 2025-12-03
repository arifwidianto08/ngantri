/**
 * Test Utilities
 * Shared test helpers and fixtures
 */

export const API_URL = process.env.API_URL || "http://localhost:3000/api";

/**
 * Helper to create a test session
 */
export async function createTestSession() {
  const res = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  return data.data?.id;
}

/**
 * Helper to get test menus
 */
export async function getTestMenus(limit = 1) {
  const res = await fetch(`${API_URL}/admin/menus`);
  const data = await res.json();
  return data.data?.slice(0, limit) || [];
}

/**
 * Helper to get test merchants
 */
export async function getTestMerchants(limit = 1) {
  const res = await fetch(`${API_URL}/admin/merchants`);
  const data = await res.json();
  return data.data?.slice(0, limit) || [];
}

/**
 * Helper to get test categories
 */
export async function getTestCategories(limit = 1) {
  const res = await fetch(`${API_URL}/admin/categories`);
  const data = await res.json();
  return data.data?.slice(0, limit) || [];
}

/**
 * Helper to create a test order
 */
export async function createTestOrder(
  sessionId: string,
  merchantId: string,
  items: Array<{ menuId: string; quantity: number; unitPrice: number }> = []
) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      merchantId,
      items,
    }),
  });
  const data = await res.json();
  return data.data?.order;
}

/**
 * Helper to add items to cart
 */
export async function addToCart(
  sessionId: string,
  menuId: string,
  quantity = 1
) {
  const res = await fetch(`${API_URL}/sessions/${sessionId}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_id: menuId,
      quantity,
    }),
  });
  const data = await res.json();
  return data.data?.cartItem;
}

/**
 * Helper to bulk add items to cart
 */
export async function bulkAddToCart(sessionId: string, items: unknown[]) {
  const res = await fetch(`${API_URL}/sessions/${sessionId}/cart/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  return data.data?.cartItems;
}

/**
 * Helper to clear cart
 */
export async function clearCart(sessionId: string) {
  const res = await fetch(`${API_URL}/sessions/${sessionId}/cart`, {
    method: "DELETE",
  });
  const data = await res.json();
  return data.success;
}

/**
 * Assert helper for API responses
 */
export function assertSuccessResponse(
  data: Record<string, unknown>,
  message?: string
) {
  if (!data.success) {
    throw new Error(
      message || `Expected successful response, got: ${JSON.stringify(data)}`
    );
  }
  return data.data;
}

/**
 * Assert helper for error responses
 */
export function assertErrorResponse(
  data: Record<string, unknown>,
  expectedMessage?: string
) {
  if (data.success) {
    throw new Error("Expected error response, but got success");
  }
  if (
    expectedMessage &&
    typeof data.message === "string" &&
    !data.message.includes(expectedMessage)
  ) {
    throw new Error(
      `Expected error containing "${expectedMessage}", got: ${data.message}`
    );
  }
  return data;
}
