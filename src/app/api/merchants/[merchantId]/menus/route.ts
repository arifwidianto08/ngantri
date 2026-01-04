/**
 * GET /api/merchants/[merchantId]/menus
 * Get menu items for a merchant with offset-based pagination
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { menus, menuCategories } from "@/data/schema";
import { eq, count } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;

    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || "10"))
    );

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Run both queries concurrently
    const [countResult, menuItems] = await Promise.all([
      db
        .select({ total: count(menus.id) })
        .from(menus)
        .where(eq(menus.merchantId, merchantId)),

      db
        .select({
          id: menus.id,
          name: menus.name,
          description: menus.description,
          price: menus.price,
          imageUrl: menus.imageUrl,
          isAvailable: menus.isAvailable,
          categoryId: menus.categoryId,
          categoryName: menuCategories.name,
          createdAt: menus.createdAt,
        })
        .from(menus)
        .leftJoin(menuCategories, eq(menus.categoryId, menuCategories.id))
        .where(eq(menus.merchantId, merchantId))
        .orderBy(menus.createdAt)
        .limit(pageSize)
        .offset(offset),
    ]);

    // Extract total
    const total = countResult?.[0]?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: menuItems,
      pagination: {
        page,
        pageSize,
        totalCount: total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching merchant menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
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
