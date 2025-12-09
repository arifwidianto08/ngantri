import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { max } from "drizzle-orm";
import { createHash } from "node:crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { name, phoneNumber, password, description, imageUrl } = body;

    // Validation
    if (!name || !phoneNumber || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing required fields: name, phoneNumber, password",
          },
        },
        { status: 400 }
      );
    }

    // Get next merchant number
    const lastMerchant = await db
      .select({ maxNumber: max(merchants.merchantNumber) })
      .from(merchants);

    const nextMerchantNumber = (lastMerchant[0]?.maxNumber || 0) + 1;

    const passwordHash = hashPassword(password);

    const newMerchant = await db
      .insert(merchants)
      .values({
        name,
        phoneNumber,
        passwordHash,
        merchantNumber: nextMerchantNumber,
        description: description || null,
        imageUrl: imageUrl || null,
        isAvailable: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newMerchant[0],
    });
  } catch (error) {
    console.error("Error creating merchant:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to create merchant" },
      },
      { status: 500 }
    );
  }
}
