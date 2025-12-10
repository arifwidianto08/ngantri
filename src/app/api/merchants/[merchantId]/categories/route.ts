import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menuCategories, menus } from "@/data/schema";
import { eq, and, isNull, count, sql } from "drizzle-orm";

/**
 * GET /api/merchants/[merchantId]/categories
 * Get all categories for a merchant with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId } = await params;

    // Verify merchant owns this
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    const page = Math.max(1, Number.parseInt(pageParam || "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, Number.parseInt(pageSizeParam || "10", 10))
    );
    const offset = (page - 1) * pageSize;

    // Build where clause once
    const whereClause = and(
      eq(menuCategories.merchantId, merchantId),
      isNull(menuCategories.deletedAt)
    );

    // Run both queries concurrently
    const [countResult, categories] = await Promise.all([
      // 1️⃣ Total count (unchanged)
      db
        .select({ total: count(menuCategories.id) })
        .from(menuCategories)
        .where(whereClause)
        .then(([row]) => row),

      // 2️⃣ Categories with menuCount combined using LEFT JOIN + COUNT()
      db
        .select({
          id: menuCategories.id,
          name: menuCategories.name,
          merchantId: menuCategories.merchantId,
          createdAt: menuCategories.createdAt,

          // combined menu count
          menuCount: sql<number>`COUNT(${menus.id})`.as("menuCount"),
        })
        .from(menuCategories)
        .leftJoin(
          menus,
          and(eq(menus.categoryId, menuCategories.id), isNull(menus.deletedAt))
        )
        .where(whereClause)
        .groupBy(menuCategories.id)
        .orderBy(menuCategories.name)
        .limit(pageSize)
        .offset(offset),
    ]);

    // Pagination calc
    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch categories" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchants/[merchantId]/categories
 * Create new category (merchant only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId } = await params;

    // Verify merchant owns this
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

    // Normalize name for case-insensitive comparison
    const normalizedName = name.trim().toLowerCase();
    const [existingCategory] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, merchantId),
          sql`LOWER(${menuCategories.name}) = ${normalizedName}`,
          isNull(menuCategories.deletedAt)
        )
      );

    if (existingCategory) {
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
    const [category] = await db
      .insert(menuCategories)
      .values({
        merchantId,
        name,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: { message: "Failed to create category" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchants/[merchantId]/categories/[categoryId]
 * Delete a category (only if no menus use it)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; categoryId: string }> }
) {
  try {
    const authenticatedMerchant = await requireMerchantAuth(request);
    const { merchantId, categoryId } = await params;

    // Verify merchant owns this
    if (authenticatedMerchant.id !== merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if category exists and belongs to merchant
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.merchantId, merchantId),
          isNull(menuCategories.deletedAt)
        )
      );

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if any menus use this category
    const [menuCount] = await db
      .select({ count: count(menus.id) })
      .from(menus)
      .where(and(eq(menus.categoryId, categoryId), isNull(menus.deletedAt)));

    if (menuCount.count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. It has ${menuCount.count} menu item(s) using it. Please move or delete these items first.`,
          menuCount: menuCount.count,
        },
        { status: 409 }
      );
    }

    // Safe to delete - soft delete
    await db
      .update(menuCategories)
      .set({ deletedAt: new Date() })
      .where(eq(menuCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
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
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
