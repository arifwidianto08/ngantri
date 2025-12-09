import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menus } from "@/data/schema";

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { merchantId, categoryId, name, description, price, imageUrl } = body;

    // Validation
    if (!merchantId || !categoryId || !name || !price) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing required fields" },
        },
        { status: 400 }
      );
    }

    const newMenu = await db
      .insert(menus)
      .values({
        merchantId,
        categoryId,
        name,
        description: description || null,
        price: Math.round(price),
        imageUrl: imageUrl || null,
        isAvailable: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newMenu[0],
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to create menu" },
      },
      { status: 500 }
    );
  }
}
