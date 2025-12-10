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

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body, use defaults
    }
    const status = (body as { status?: string }).status || "paid";

    const { payment } = await db.transaction(async (tx) => {
      // Find and update related order_payments
      const [payment] = await tx
        .update(orderPayments)
        .set({
          status: status || "paid",
          paymentMethod: status === "paid" ? "cash" : null,
          paidAt: status === "paid" ? now : null,
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
      message:
        status === "paid"
          ? "Order payment marked as paid"
          : "Order payment marked as unpaid",
    });
  } catch (error) {
    console.error("Error updating order payment status:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to mark order as paid" },
      },
      { status: 500 }
    );
  }
}
