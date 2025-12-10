import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menuCategories } from "@/data/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { merchantId } = body;
    let { name } = body;

    // Validation
    if (!merchantId || !name) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing required fields" },
        },
        { status: 400 }
      );
    }

    // Check for duplicate category name (case-insensitive)
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
          success: false,
          error: {
            message: `Category "${name}" already exists for this merchant`,
          },
        },
        { status: 409 }
      );
    }

    name = name.trim();
    const newCategory = await db
      .insert(menuCategories)
      .values({
        merchantId,
        name,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newCategory[0],
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to create category" },
      },
      { status: 500 }
    );
  }
}
