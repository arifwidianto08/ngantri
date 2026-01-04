import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { MerchantRepositoryImpl } from "@/data/repositories/merchant-repository";
import { z } from "zod";
import bcrypt from "bcryptjs";

const merchantRepository = new MerchantRepositoryImpl();

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "New password is too long"),
});

/**
 * PUT /api/merchants/profile/password
 * Change merchant password
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate merchant
    const authenticatedMerchant = await requireMerchantAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = passwordChangeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get full merchant data
    const merchant = await merchantRepository.findById(
      authenticatedMerchant.id
    );

    if (!merchant) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Merchant not found" },
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      merchant.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Current password is incorrect" },
        },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await merchantRepository.update(merchant.id, {
      passwordHash: newPasswordHash,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Password updated successfully",
      },
    });
  } catch (error) {
    console.error("Error changing password:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
