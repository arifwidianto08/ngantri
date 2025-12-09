import { type NextRequest, NextResponse } from "next/server";
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await requireAdminAuth();

    const { merchantId } = await params;
    const body = await request.json();
    const { name, description, imageUrl, isAvailable } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Merchant name is required" },
        },
        { status: 400 }
      );
    }

    const updatedMerchant = await db
      .update(merchants)
      .set({
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        isAvailable: isAvailable ?? true,
      })
      .where(eq(merchants.id, merchantId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMerchant[0],
    });
  } catch (error) {
    console.error("Error updating merchant:", error);

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
        error: { message: "Failed to update merchant" },
      },
      { status: 500 }
    );
  }
}
