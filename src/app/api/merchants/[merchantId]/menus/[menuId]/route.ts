import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menus } from "@/data/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/merchants/[merchantId]/menus/[menuId]
 * Update menu item (merchant only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; menuId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId, menuId } = await params;

    // Verify merchant owns this menu
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { isAvailable, name, description, price, categoryId, imageUrl } = body;

    // Get existing menu to verify ownership
    const [existingMenu] = await db
      .select()
      .from(menus)
      .where(and(eq(menus.id, menuId), eq(menus.merchantId, merchantId)))
      .limit(1);

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Update menu
    const updateData: Record<string, unknown> = {};
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    updateData.updatedAt = new Date();

    const [updatedMenu] = await db
      .update(menus)
      .set(updateData)
      .where(eq(menus.id, menuId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMenu,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error updating menu:", error);
    return NextResponse.json(
      { error: "Failed to update menu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchants/[merchantId]/menus/[menuId]
 * Delete menu item (merchant only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; menuId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId, menuId } = await params;

    // Verify merchant owns this menu
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete menu
    await db
      .update(menus)
      .set({ deletedAt: new Date() })
      .where(and(eq(menus.id, menuId), eq(menus.merchantId, merchantId)));

    return NextResponse.json({
      success: true,
      data: { message: "Menu deleted successfully" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error deleting menu:", error);
    return NextResponse.json(
      { error: "Failed to delete menu" },
      { status: 500 }
    );
  }
}
