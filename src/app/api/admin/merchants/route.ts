import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { isNull, count } from "drizzle-orm";

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
    const whereClause = isNull(merchants.deletedAt);

    // Run count + paginated list concurrently
    const [countResult, merchantList] = await Promise.all([
      db
        .select({ total: count(merchants.id) })
        .from(merchants)
        .where(whereClause)
        .then(([row]) => row),

      db
        .select({
          id: merchants.id,
          phoneNumber: merchants.phoneNumber,
          merchantNumber: merchants.merchantNumber,
          name: merchants.name,
          imageUrl: merchants.imageUrl,
          description: merchants.description,
          isAvailable: merchants.isAvailable,
          createdAt: merchants.createdAt,
        })
        .from(merchants)
        .where(whereClause)
        .orderBy(merchants.name)
        .limit(pageSize)
        .offset(offset),
    ]);

    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      success: true,
      data: merchantList,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching merchants:", error);

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
        error: { message: "Failed to fetch merchants" },
      },
      { status: 500 }
    );
  }
}
