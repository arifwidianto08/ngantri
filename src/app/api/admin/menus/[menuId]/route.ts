import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menus, merchants, menuCategories } from "@/data/schema";
import { eq, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    await requireAdminAuth();

    const { menuId } = await params;

    const menu = await db
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
      .where(eq(menus.id, menuId))
      .limit(1);

    if (!menu.length) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Menu not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: menu[0],
    });
  } catch (error) {
    console.error("Error fetching menu:", error);

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
        error: { message: "Failed to fetch menu" },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    await requireAdminAuth();

    const { menuId } = await params;

    await db
      .update(menus)
      .set({ deletedAt: new Date() })
      .where(eq(menus.id, menuId));

    return NextResponse.json({
      success: true,
      data: { message: "Menu deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting menu:", error);

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
        error: { message: "Failed to delete menu" },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    await requireAdminAuth();

    const { menuId } = await params;
    const body = await request.json();
    const { name, description, price, imageUrl, isAvailable } = body;

    // Validation
    if (!name || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing required fields" },
        },
        { status: 400 }
      );
    }

    const updatedMenu = await db
      .update(menus)
      .set({
        name,
        description: description || null,
        price: Math.round(price),
        imageUrl: imageUrl || null,
        isAvailable: isAvailable ?? true,
      })
      .where(eq(menus.id, menuId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMenu[0],
    });
  } catch (error) {
    console.error("Error updating menu:", error);

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
        error: { message: "Failed to update menu" },
      },
      { status: 500 }
    );
  }
}
