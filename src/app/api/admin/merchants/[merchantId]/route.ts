import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await requireAdminAuth();

    const { merchantId } = await params;

    await db
      .update(merchants)
      .set({ deletedAt: new Date() })
      .where(eq(merchants.id, merchantId));

    return NextResponse.json({
      success: true,
      data: { message: "Merchant deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting merchant:", error);

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
        error: { message: "Failed to delete merchant" },
      },
      { status: 500 }
    );
  }
}
