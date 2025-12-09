/**
 * GET /api/merchants
 * Get all active merchants for the buyer interface
 */
import { MerchantRepositoryImpl } from "../../../data/repositories/merchant-repository";
import { MerchantService } from "../../../services/merchant-service";
import type { NextRequest } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../lib/errors";
import { createPaginationParams } from "../../../lib/pagination";

const merchantRepository = new MerchantRepositoryImpl();
const merchantService = new MerchantService(merchantRepository);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paginationParams = createPaginationParams({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
      direction: searchParams.get("direction") || undefined,
    });

    const result = await merchantService.findAll(paginationParams);
    return createSuccessResponse(result.data, result.pagination);
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to fetch merchants",
      500
    );
  }
}
