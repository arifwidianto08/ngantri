import { NextRequest } from "next/server";
import { MerchantRepositoryImpl } from "@/data/repositories/merchant-repository";

const merchantRepository = new MerchantRepositoryImpl();

export interface AuthenticatedMerchant {
  id: string;
  name: string;
  phoneNumber: string;
  description: string | null;
  imageUrl: string | null;
  merchantNumber: number;
  isAvailable: boolean;
}

/**
 * Get the authenticated merchant from the session cookie
 * @param request - The NextRequest object
 * @returns The authenticated merchant or null if not authenticated
 */
export async function getAuthenticatedMerchant(
  request: NextRequest
): Promise<AuthenticatedMerchant | null> {
  try {
    const sessionCookie = request.cookies.get("merchant-session");

    if (!sessionCookie?.value) {
      return null;
    }

    const merchantId = sessionCookie.value;

    // Get merchant from database
    const merchant = await merchantRepository.findById(merchantId);

    if (!merchant || merchant.deletedAt) {
      return null;
    }

    return {
      id: merchant.id,
      name: merchant.name,
      description: merchant.description,
      imageUrl: merchant.imageUrl,
      phoneNumber: merchant.phoneNumber,
      merchantNumber: merchant.merchantNumber,
      isAvailable: merchant.isAvailable,
    };
  } catch (error) {
    console.error("Error getting authenticated merchant:", error);
    return null;
  }
}

/**
 * Middleware helper to require authentication
 * Returns the merchant if authenticated, throws error if not
 */
export async function requireMerchantAuth(
  request: NextRequest
): Promise<AuthenticatedMerchant> {
  const merchant = await getAuthenticatedMerchant(request);

  if (!merchant) {
    throw new Error("Authentication required");
  }

  return merchant;
}
