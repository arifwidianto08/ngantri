import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await requireAdminAuth();

    const { merchantId } = await params;
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
      .update(merchants)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(merchants.id, merchantId));

    return NextResponse.json({
      success: true,
      data: { message: "Merchant availability updated" },
    });
  } catch (error) {
    console.error("Error updating merchant availability:", error);

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
        error: { message: "Failed to update merchant availability" },
      },
      { status: 500 }
    );
  }
}
