/**
 * Cookie management utilities for buyer sessions
 * Handles automatic session creation and cart tracking
 */

export interface BuyerSession {
  id: string;
  tableNumber?: number;
  createdAt: string;
  expiresAt: string;
}

const SESSION_COOKIE_NAME = "ngantri_buyer_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get buyer session from cookies
 */
export function getBuyerSession(): BuyerSession | null {
  if (typeof document === "undefined") return null;

  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(SESSION_COOKIE_NAME + "="));

  if (!cookieValue) return null;

  try {
    const sessionData = JSON.parse(
      decodeURIComponent(cookieValue.split("=")[1])
    );

    // Check if session has expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      removeBuyerSession();
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error("Error parsing buyer session cookie:", error);
    removeBuyerSession();
    return null;
  }
}

/**
 * Set buyer session in cookies
 */
export function setBuyerSession(session: BuyerSession): void {
  if (typeof document === "undefined") return;

  const cookieValue = encodeURIComponent(JSON.stringify(session));
  const expires = new Date(Date.now() + SESSION_DURATION).toUTCString();

  document.cookie = `${SESSION_COOKIE_NAME}=${cookieValue}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Remove buyer session from cookies
 */
export function removeBuyerSession(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Create a new buyer session automatically
 */
export async function createBuyerSession(
  tableNumber?: number
): Promise<BuyerSession | null> {
  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_number: tableNumber }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    const result = await response.json();
    const session: BuyerSession = {
      id: result.data.session.id,
      tableNumber: result.data.session.tableNumber,
      createdAt: result.data.session.createdAt,
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
    };

    setBuyerSession(session);
    return session;
  } catch (error) {
    console.error("Error creating buyer session:", error);
    return null;
  }
}

/**
 * Get or create buyer session automatically
 * This is the main function to use for session management
 */
export async function getOrCreateBuyerSession(
  tableNumber?: number
): Promise<BuyerSession | null> {
  // Try to get existing session
  const existingSession = getBuyerSession();
  if (existingSession) {
    return existingSession;
  }

  // Create new session if none exists
  return await createBuyerSession(tableNumber);
}

/**
 * Update table number for existing session
 */
export async function updateSessionTableNumber(
  tableNumber: number
): Promise<boolean> {
  const session = getBuyerSession();
  if (!session) return false;

  try {
    const response = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_number: tableNumber }),
    });

    if (response.ok) {
      // Update local cookie
      const updatedSession = { ...session, tableNumber };
      setBuyerSession(updatedSession);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating table number:", error);
    return false;
  }
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(session: BuyerSession | null): boolean {
  if (!session) return false;
  return new Date(session.expiresAt) > new Date();
}
