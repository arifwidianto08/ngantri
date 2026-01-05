import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { admins } from "@/data/schema";
import { eq, isNull, and } from "drizzle-orm";
import { z } from "zod";

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
});

/**
 * PUT /api/admin/profile
 * Update current admin profile
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
    const validationResult = profileUpdateSchema.safeParse(body);

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

    const updates = validationResult.data;

    // If username is being updated, check if it's unique
    if (updates.username) {
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(
          and(eq(admins.username, updates.username), isNull(admins.deletedAt))
        )
        .limit(1);

      if (existingAdmin.length > 0 && existingAdmin[0].id !== session.adminId) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Username already taken" },
          },
          { status: 400 }
        );
      }
    }

    // Update admin profile
    const [updatedAdmin] = await db
      .update(admins)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(admins.id, session.adminId), isNull(admins.deletedAt)))
      .returning();

    if (!updatedAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Admin not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: updatedAdmin.id,
          username: updatedAdmin.username,
          name: updatedAdmin.name,
          updatedAt: updatedAdmin.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);

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
