import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menuCategories } from "@/data/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await requireAdminAuth();

    const { categoryId } = await params;

    await db
      .update(menuCategories)
      .set({ deletedAt: new Date() })
      .where(eq(menuCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      data: { message: "Category deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Unauthorized" },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to delete category" },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await requireAdminAuth();

    const { categoryId } = await params;
    const body = await request.json();
    let { name } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Category name is required" },
        },
        { status: 400 }
      );
    }

    // Check for duplicate category name (case-insensitive), excluding current category
    const normalizedName = name.trim().toLowerCase();
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.id, categoryId));

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Category not found" },
        },
        { status: 404 }
      );
    }

    const [existingCategory] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, category.merchantId),
          sql`LOWER(${menuCategories.name}) = ${normalizedName}`,
          sql`${menuCategories.id} != ${categoryId}`,
          isNull(menuCategories.deletedAt)
        )
      );

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Category "${name}" already exists for this merchant`,
          },
        },
        { status: 409 }
      );
    }

    name = name.trim();
    const updatedCategory = await db
      .update(menuCategories)
      .set({ name })
      .where(eq(menuCategories.id, categoryId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCategory[0],
    });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Unauthorized" },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to update category" },
      },
      { status: 500 }
    );
  }
}
