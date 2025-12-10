import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menus, merchants, menuCategories } from "@/data/schema";
import { isNull, eq, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

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
    const whereClause = isNull(menus.deletedAt);

    // Run both queries concurrently
    const [countResult, allMenus] = await Promise.all([
      db
        .select({ total: count(menus.id) })
        .from(menus)
        .where(whereClause)
        .then(([row]) => row),

      db
        .select({
          id: menus.id,
          merchantId: menus.merchantId,
          merchantName: merchants.name,
          categoryId: menus.categoryId,
          categoryName: menuCategories.name,
          name: menus.name,
          imageUrl: menus.imageUrl,
          description: menus.description,
          price: menus.price,
          isAvailable: menus.isAvailable,
          createdAt: menus.createdAt,
        })
        .from(menus)
        .leftJoin(merchants, eq(menus.merchantId, merchants.id))
        .leftJoin(menuCategories, eq(menus.categoryId, menuCategories.id))
        .where(whereClause)
        .orderBy(menus.name)
        .limit(pageSize)
        .offset(offset),
    ]);

    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      success: true,
      data: allMenus,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching menus:", error);

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
        error: { message: "Failed to fetch menus" },
      },
      { status: 500 }
    );
  }
}
