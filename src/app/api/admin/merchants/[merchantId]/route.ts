import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { eq, and, ne } from "drizzle-orm";

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
    const { name, phoneNumber, description, imageUrl, isAvailable } = body;

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

    // Check if phone number is being updated and if it's unique
    if (phoneNumber) {
      const existingMerchant = await db
        .select()
        .from(merchants)
        .where(
          and(
            eq(merchants.phoneNumber, phoneNumber),
            ne(merchants.id, merchantId)
          )
        )
        .limit(1);

      if (existingMerchant.length > 0 && !existingMerchant[0].deletedAt) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Phone number already registered" },
          },
          { status: 409 }
        );
      }
    }

    const updateData: {
      name: string;
      description: string | null;
      imageUrl: string | null;
      isAvailable: boolean;
      phoneNumber?: string;
    } = {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      isAvailable: isAvailable ?? true,
    };

    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }

    const updatedMerchant = await db
      .update(merchants)
      .set(updateData)
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
