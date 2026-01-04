import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { MerchantService } from "@/services/merchant-service";
import { MerchantRepositoryImpl } from "@/data/repositories/merchant-repository";
import { z } from "zod";
import { db } from "@/lib/db";
import { merchants } from "@/data/schema";
import { eq, and, ne, desc } from "drizzle-orm";

const merchantRepository = new MerchantRepositoryImpl();
const merchantService = new MerchantService(merchantRepository);

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().max(255).optional().nullable(),
  isAvailable: z.boolean().optional(),
});

/**
 * PUT /api/merchants/profile
 * Update current merchant profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate merchant
    const merchant = await requireMerchantAuth(request);

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

    // Check if phone number is being updated and if it's unique
    if (validationResult.data.phoneNumber) {
      const existingMerchant = await db
        .select()
        .from(merchants)
        .where(
          and(
            eq(merchants.phoneNumber, validationResult.data.phoneNumber),
            ne(merchants.id, merchant.id)
          )
        )
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
    }

    const updates = {
      ...validationResult.data,
      description:
        validationResult.data.description === null
          ? undefined
          : validationResult.data.description,
      imageUrl:
        validationResult.data.imageUrl === null
          ? undefined
          : validationResult.data.imageUrl,
    };

    // Update merchant profile
    const updatedMerchant = await merchantService.update(merchant.id, updates);

    return NextResponse.json({
      success: true,
      data: {
        merchant: {
          id: updatedMerchant.id,
          name: updatedMerchant.name,
          phoneNumber: updatedMerchant.phoneNumber,
          merchantNumber: updatedMerchant.merchantNumber,
          description: updatedMerchant.description,
          imageUrl: updatedMerchant.imageUrl,
          isAvailable: updatedMerchant.isAvailable,
          updatedAt: updatedMerchant.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error updating merchant profile:", error);

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
