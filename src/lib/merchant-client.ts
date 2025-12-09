/**
 * Utility to get merchant ID from session storage or localStorage
 * The merchant ID is stored in the merchant-session cookie
 */
export function getMerchantIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  // Try to get from sessionStorage first (faster)
  const sessionId = sessionStorage.getItem("merchantId");
  if (sessionId) return sessionId;

  // Try to get from localStorage
  const localId = localStorage.getItem("merchantId");
  if (localId) return localId;

  return null;
}

export function setMerchantIdInStorage(merchantId: string | null): void {
  if (typeof window === "undefined") return;
  if (!merchantId) return;

  sessionStorage.setItem("merchantId", merchantId);
  localStorage.setItem("merchantId", merchantId);
}

/**
 * Fetch merchant info and cache the ID
 */
export async function fetchAndCacheMerchantId(): Promise<string | null> {
  try {
    // Check if already cached
    const cached = getMerchantIdFromStorage();
    if (cached) return cached;

    // Otherwise fetch
    const response = await fetch("/api/merchants/me");
    const result = await response.json();

    if (result.success && result.data.merchant?.id) {
      setMerchantIdInStorage(result.data.merchant.id);
      return result.data.merchant.id;
    }
  } catch (error) {
    console.error("Error fetching merchant info:", error);
  }

  return null;
}
