import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menuCategories, merchants } from "@/data/schema";
import { isNull, eq, count, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const merchantIdParam = searchParams.get("merchantId");

    const page = Math.max(1, Number.parseInt(pageParam || "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, Number.parseInt(pageSizeParam || "10", 10))
    );
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions = [isNull(menuCategories.deletedAt)];
    if (merchantIdParam && merchantIdParam !== "all") {
      whereConditions.push(eq(menuCategories.merchantId, merchantIdParam));
    }
    const whereClause = and(...whereConditions);

    // Get total count
    const [countResult] = await db
      .select({ total: count(menuCategories.id) })
      .from(menuCategories)
      .where(whereClause);

    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated categories
    const categories = await db
      .select({
        id: menuCategories.id,
        merchantId: menuCategories.merchantId,
        merchantName: merchants.name,
        name: menuCategories.name,
        createdAt: menuCategories.createdAt,
      })
      .from(menuCategories)
      .leftJoin(merchants, eq(menuCategories.merchantId, merchants.id))
      .where(whereClause)
      .orderBy(menuCategories.name)
      .limit(pageSize)
      .offset(offset);

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
    console.error("Error fetching categories:", error);

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
        error: { message: "Failed to fetch categories" },
      },
      { status: 500 }
    );
  }
}
