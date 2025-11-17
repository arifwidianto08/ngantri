import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menus } from "@/data/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    await requireAdminAuth();

    const { menuId } = await params;
    const body = await request.json();
    const { isAvailable } = body;

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "isAvailable must be a boolean" },
        },
        { status: 400 }
      );
    }

    await db
      .update(menus)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(menus.id, menuId));

    return NextResponse.json({
      success: true,
      data: { message: "Menu availability updated" },
    });
  } catch (error) {
    console.error("Error updating menu availability:", error);

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
        error: { message: "Failed to update menu availability" },
      },
      { status: 500 }
    );
  }
}
