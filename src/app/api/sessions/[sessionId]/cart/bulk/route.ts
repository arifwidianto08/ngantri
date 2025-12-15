/**
 * POST /api/sessions/[sessionId]/cart/bulk
 * Add multiple items to cart for a specific session in bulk
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SessionRepositoryImpl } from "../../../../../../data/repositories/session-repository";
import { SessionService } from "../../../../../../services/session-service";
import { MenuRepositoryImpl } from "../../../../../../data/repositories/menu-repository";
import { MenuService } from "../../../../../../services/menu-service";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../../../../lib/errors";
import type { NewCartItem } from "../../../../../../data/schema";

const sessionRepository = new SessionRepositoryImpl();
const sessionService = new SessionService(sessionRepository);
const menuRepository = new MenuRepositoryImpl();
const menuService = new MenuService(menuRepository);

const bulkAddToCartHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const { sessionId } = await params;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid or empty request body",
        400
      );
    }

    const { items } = body as Record<string, unknown>;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Items array is required and must not be empty",
        400
      );
    }

    // Check local storage sessionId: validate in DB, create if doesn't exist
    await sessionService.findOrCreateSession(sessionId);

    // Validate and prepare items
    const cartItemsToAdd: NewCartItem[] = [];

    for (const item of items) {
      const { menu_id, quantity = 1, unit_price, notes } = item;

      // Validate required fields
      if (!menu_id) {
        return createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "Menu ID is required for all items",
          400
        );
      }

      if (typeof quantity !== "number" || quantity <= 0) {
        return createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "Quantity must be a positive number for all items",
          400
        );
      }

      // Verify menu item exists and is available
      const menuItem = await menuService.findMenuItemById(menu_id);
      if (!menuItem.isAvailable) {
        return createErrorResponse(
          ERROR_CODES.MENU_UNAVAILABLE,
          `Menu item ${menu_id} is not available`,
          400
        );
      }

      // Use provided unit_price or get from menu
      const priceSnapshot = unit_price || menuItem.price;

      cartItemsToAdd.push({
        sessionId,
        merchantId: menuItem.merchantId,
        menuId: menu_id,
        quantity,
        priceSnapshot,
        notes: notes || null,
      });
    }

    // Add all cart items in bulk
    const createdItems = await sessionRepository.addCartItems(cartItemsToAdd);

    return NextResponse.json(
      createSuccessResponse({ cartItems: createdItems })
    );
  } catch (error) {
    console.error("Error bulk adding to cart:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to add items to cart",
      500
    );
  }
};

export { bulkAddToCartHandler as POST };
