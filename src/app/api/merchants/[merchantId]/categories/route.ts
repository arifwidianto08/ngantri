import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menuCategories, menus } from "@/data/schema";
import { eq, and, isNull, count } from "drizzle-orm";

/**
 * GET /api/merchants/[merchantId]/categories
 * Get all categories for a merchant
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
      .orderBy(menuCategories.name);

    // Get menu count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const [result] = await db
          .select({ menuCount: count(menus.id) })
          .from(menus)
          .where(
            and(eq(menus.categoryId, category.id), isNull(menus.deletedAt))
          );

        return {
          ...category,
          menuCount: result?.menuCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { categories: categoriesWithCount },
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
