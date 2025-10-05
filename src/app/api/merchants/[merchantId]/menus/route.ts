/**
 * GET /api/merchants/[merchantId]/menus
 * Get menu items for a merchant with pagination
 */

import { NextRequest } from "next/server";
import { MenuRepositoryImpl } from "../../../../../data/repositories/MenuRepository";
import { MenuService } from "../../../../../services/MenuService";
import {
  createSuccessResponse,
  withErrorHandler,
} from "../../../../../lib/errors";
import { createPaginationParams } from "../../../../../lib/pagination";

const menuRepository = new MenuRepositoryImpl();
const menuService = new MenuService(menuRepository);

const getMenusHandler = async (
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) => {
  const { merchantId } = params;

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

  return createSuccessResponse(result);
};

export const GET = withErrorHandler(getMenusHandler);
