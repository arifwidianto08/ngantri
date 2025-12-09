import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menus } from "@/data/schema";
import { eq } from "drizzle-orm";

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
