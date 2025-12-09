import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menuCategories } from "@/data/schema";

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { merchantId, name } = body;

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
