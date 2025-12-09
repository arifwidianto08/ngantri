/**
 * GET /api/merchants/[merchantId]/menus
 * Get menu items for a merchant with pagination
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menus } from "@/data/schema";
import { MenuRepositoryImpl } from "../../../../../data/repositories/menu-repository";
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

/**
 * POST /api/merchants/[merchantId]/menus
 * Create new menu item (merchant only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId } = await params;

    // Verify merchant owns this resource
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, categoryId, imageUrl } = body;

    // Validate required fields
    if (!name || price === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Name, price, and categoryId are required" },
        { status: 400 }
      );
    }

    // Create menu
    const [newMenu] = await db
      .insert(menus)
      .values({
        id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: description || null,
        price,
        categoryId,
        imageUrl: imageUrl || null,
        merchantId,
        isAvailable: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newMenu,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: "Failed to create menu" },
      { status: 500 }
    );
  }
}
