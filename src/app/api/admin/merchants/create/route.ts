import { type NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { max, eq, isNull, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

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

    // Check if phone number already exists
    const existingMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.phoneNumber, phoneNumber))
      .orderBy(desc(merchants.createdAt))
      .limit(1);

    if (existingMerchant.length > 0 && !existingMerchant[0].deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Phone number already registered",
          },
        },
        { status: 409 }
      );
    }

    // Get next merchant number
    const lastMerchant = await db
      .select({ maxNumber: max(merchants.merchantNumber) })
      .from(merchants);

    const nextMerchantNumber = (lastMerchant[0]?.maxNumber || 0) + 1;

    // Hash password using bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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
