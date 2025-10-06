import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMerchant } from "@/lib/merchantAuth";

/**
 * GET /api/merchants/me
 * Get current authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    const merchant = await getAuthenticatedMerchant(request);

    if (!merchant) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Not authenticated" },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchant,
      },
    });
  } catch (error) {
    console.error("Error getting current merchant:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
