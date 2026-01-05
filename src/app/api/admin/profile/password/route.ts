import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { admins } from "@/data/schema";
import { eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "New password is too long"),
});

/**
 * PUT /api/admin/profile/password
 * Change admin password
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate admin
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" },
        },
        { status: 401 }
      );
    }

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

    // Get full admin data
    const [admin] = await db
      .select()
      .from(admins)
      .where(and(eq(admins.id, session.adminId), isNull(admins.deletedAt)))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Admin not found" },
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
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
    await db
      .update(admins)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(and(eq(admins.id, admin.id), isNull(admins.deletedAt)));

    return NextResponse.json({
      success: true,
      data: {
        message: "Password updated successfully",
      },
    });
  } catch (error) {
    console.error("Error changing password:", error);

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
