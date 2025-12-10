import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderPayments } from "@/data/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Unauthorized" },
      },
      { status: 401 }
    );
  }

  try {
    const { orderId } = await params;
    const now = new Date();
    const { payment } = await db.transaction(async (tx) => {
      // Find and update related order_payments
      const [payment] = await tx
        .update(orderPayments)
        .set({
          status: "paid",
          paymentMethod: "cash",
          paidAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(orderPayments.orderId, orderId),
            isNull(orderPayments.deletedAt)
          )
        )
        .returning();

      return {
        payment,
      };
    });

    return NextResponse.json({
      success: true,
      data: payment,
      message: "Order marked as paid",
    });
  } catch (error) {
    console.error("Error marking order as paid:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to mark order as paid" },
      },
      { status: 500 }
    );
  }
}
