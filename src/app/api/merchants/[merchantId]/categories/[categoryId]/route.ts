import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menuCategories } from "@/data/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/**
 * PATCH /api/merchants/[merchantId]/categories/[categoryId]
 * Update category (merchant only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; categoryId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId, categoryId } = await params;

    // Verify merchant owns this category
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    let { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: { message: "Category name is required" } },
        { status: 400 }
      );
    }

    // Verify category exists and belongs to merchant
    const [existing] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.merchantId, merchantId),
          isNull(menuCategories.deletedAt)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate category name (case-insensitive), excluding current category
    const normalizedName = name.trim().toLowerCase();
    const [duplicate] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, merchantId),
          sql`LOWER(${menuCategories.name}) = ${normalizedName}`,
          sql`${menuCategories.id} != ${categoryId}`,
          isNull(menuCategories.deletedAt)
        )
      )
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        {
          error: {
            message: `Category "${name}" already exists for your merchant`,
          },
        },
        { status: 409 }
      );
    }

    name = name.trim();
    const [updated] = await db
      .update(menuCategories)
      .set({ name, updatedAt: new Date() })
      .where(eq(menuCategories.id, categoryId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: { message: "Failed to update category" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchants/[merchantId]/categories/[categoryId]
 * Delete category (merchant only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; categoryId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId, categoryId } = await params;

    // Verify merchant owns this category
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify category exists and belongs to merchant
    const [existing] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.merchantId, merchantId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: { message: "Category not found" } },
        { status: 404 }
      );
    }

    // Soft delete category
    await db
      .update(menuCategories)
      .set({ deletedAt: new Date() })
      .where(eq(menuCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      data: { message: "Category deleted successfully" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: { message: "Failed to delete category" } },
      { status: 500 }
    );
  }
}
