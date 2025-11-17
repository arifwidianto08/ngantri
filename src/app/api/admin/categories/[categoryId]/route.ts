import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { menuCategories } from "@/data/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await requireAdminAuth();

    const { categoryId } = await params;

    await db
      .update(menuCategories)
      .set({ deletedAt: new Date() })
      .where(eq(menuCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      data: { message: "Category deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting category:", error);

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
        error: { message: "Failed to delete category" },
      },
      { status: 500 }
    );
  }
}
