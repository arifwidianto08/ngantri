/**
 * GET /api/merchants/[merchantId]/menus
 * Get menu items for a merchant with pagination
 */

import { NextRequest } from "next/server";
import { MenuRepositoryImpl } from "../../../../../data/repositories/MenuRepository";
import { MenuService } from "../../../../../services/menu-service";
import { createSuccessResponse } from "../../../../../lib/errors";
import { createPaginationParams } from "../../../../../lib/pagination";

const menuRepository = new MenuRepositoryImpl();
const menuService = new MenuService(menuRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;

    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const paginationParams = createPaginationParams({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
      direction: searchParams.get("direction") || undefined,
    });

    // Get menu items for merchant
    const result = await menuService.findMenuItemsByMerchant(
      merchantId,
      paginationParams
    );

    // Return in the format expected by frontend: { menus: [...] }
    return createSuccessResponse({ menus: result.data });
  } catch (error) {
    console.error("Error fetching merchant menus:", error);
    throw error;
  }
}
