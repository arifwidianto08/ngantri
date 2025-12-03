/**
 * POST /api/sessions/[sessionId]/cart
 * Add item to cart for a specific session
 *
 * DELETE /api/sessions/[sessionId]/cart
 * Clear cart for a specific session
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SessionRepositoryImpl } from "../../../../../data/repositories/session-repository";
import { SessionService } from "../../../../../services/session-service";
import { MenuRepositoryImpl } from "../../../../../data/repositories/menu-repository";
import { MenuService } from "../../../../../services/menu-service";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../../../lib/errors";

const sessionRepository = new SessionRepositoryImpl();
const sessionService = new SessionService(sessionRepository);
const menuRepository = new MenuRepositoryImpl();
const menuService = new MenuService(menuRepository);

const addToCartHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const { sessionId } = await params;

  try {
    const body = await request.json();
    const { menu_id, quantity = 1 } = body;

    // Validate required fields
    if (!menu_id) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Menu ID is required",
        400
      );
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Quantity must be a positive number",
        400
      );
    }

    // Verify session exists
    await sessionService.findSessionById(sessionId);

    // Verify menu item exists and is available
    const menuItem = await menuService.findMenuItemById(menu_id);
    if (!menuItem.isAvailable) {
      return createErrorResponse(
        ERROR_CODES.MENU_UNAVAILABLE,
        "Menu item is not available",
        400
      );
    }

    // Save cart item to database
    const cartItem = await sessionRepository.addCartItem({
      sessionId,
      merchantId: menuItem.merchantId,
      menuId: menu_id,
      quantity,
      priceSnapshot: menuItem.price,
    });

    return NextResponse.json(createSuccessResponse({ cartItem }));
  } catch (error) {
    console.error("Error adding to cart:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to add item to cart",
      500
    );
  }
};

const deleteCartHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const { sessionId } = await params;

  try {
    // Verify session exists
    await sessionService.findSessionById(sessionId);

    // Clear all cart items for this session
    await sessionRepository.clearCart(sessionId);

    return NextResponse.json(createSuccessResponse({ cleared: true }));
  } catch (error) {
    console.error("Error clearing cart:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to clear cart",
      500
    );
  }
};

export { addToCartHandler as POST, deleteCartHandler as DELETE };
