import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
