/**
 * POST /api/sessions/[sessionId]/cart
 * Add item to cart for a specific session
 */

import { NextRequest, NextResponse } from "next/server";
import { SessionRepositoryImpl } from "../../../../../data/repositories/SessionRepository";
import { SessionService } from "../../../../../services/SessionService";
import { MenuRepositoryImpl } from "../../../../../data/repositories/MenuRepository";
import { MenuService } from "../../../../../services/MenuService";
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
    const { menu_id, quantity = 1, notes } = body;

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

    // For now, just return success - in a real implementation,
    // you would store cart items in the database
    const cartItem = {
      id: `${sessionId}_${menu_id}`,
      sessionId,
      menuId: menu_id,
      quantity,
      notes: notes || null,
      menuItem: {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        imageUrl: menuItem.imageUrl,
      },
      subtotal: menuItem.price * quantity,
      createdAt: new Date().toISOString(),
    };

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

export { addToCartHandler as POST };
