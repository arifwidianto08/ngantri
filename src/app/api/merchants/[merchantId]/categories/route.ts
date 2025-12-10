import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menuCategories, menus } from "@/data/schema";
import { eq, and, isNull, count } from "drizzle-orm";

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

    // Get total count
    const [countResult] = await db
      .select({ total: count(menuCategories.id) })
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, merchantId),
          isNull(menuCategories.deletedAt)
        )
      );

    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated categories
    const categories = await db
      .select({
        id: menuCategories.id,
        name: menuCategories.name,
        merchantId: menuCategories.merchantId,
        createdAt: menuCategories.createdAt,
      })
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, merchantId),
          isNull(menuCategories.deletedAt)
        )
      )
      .orderBy(menuCategories.name)
      .limit(pageSize)
      .offset(offset);

    // Get menu count for each category in a single query using GROUP BY
    const categoryCounts = await db
      .select({
        categoryId: menus.categoryId,
        menuCount: count(menus.id),
      })
      .from(menus)
      .where(isNull(menus.deletedAt))
      .groupBy(menus.categoryId);

    // Create a map for quick lookup
    const countMap = new Map(
      categoryCounts.map((c) => [c.categoryId, c.menuCount])
    );

    // Merge counts with categories
    const categoriesWithCount = categories.map((category) => ({
      ...category,
      menuCount: countMap.get(category.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
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
      { error: "Failed to fetch categories" },
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

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
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
