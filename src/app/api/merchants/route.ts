/**
 * GET /api/merchants
 * Get all active merchants for the buyer interface
 */

import { MerchantRepositoryImpl } from "../../../data/repositories/MerchantRepository";
import { MerchantService } from "../../../services/merchant-service";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../lib/errors";

const merchantRepository = new MerchantRepositoryImpl();
const merchantService = new MerchantService(merchantRepository);

export async function GET() {
  try {
    const result = await merchantService.findAll({
      limit: 50, // Get up to 50 merchants
      direction: "asc",
    });

    // The service already filters for available merchants
    const activeMerchants = result.data.filter(
      (merchant) => merchant.isAvailable
    );

    return createSuccessResponse({ merchants: activeMerchants });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to fetch merchants",
      500
    );
  }
}
