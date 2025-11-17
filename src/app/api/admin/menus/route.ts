import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menus, merchants, menuCategories } from "@/data/schema";
import { isNull, eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdminAuth();

    const allMenus = await db
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
      .where(isNull(menus.deletedAt))
      .orderBy(menus.name);

    return NextResponse.json({
      success: true,
      data: allMenus,
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
