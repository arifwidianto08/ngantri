import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menuCategories, merchants } from "@/data/schema";
import { isNull, eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdminAuth();

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
      .where(isNull(menuCategories.deletedAt))
      .orderBy(menuCategories.name);

    return NextResponse.json({
      success: true,
      data: categories,
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
