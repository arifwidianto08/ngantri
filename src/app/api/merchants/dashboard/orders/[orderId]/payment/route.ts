import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderPayments, orderItems, menus } from "@/data/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireMerchantAuth } from "@/lib/merchant-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const merchant = await requireMerchantAuth(request);
    const { orderId } = await params;

    // Verify the order belongs to this merchant
    const orderCheck = await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(menus, eq(orderItems.menuId, menus.id))
      .where(
        and(
          eq(orders.id, orderId),
          eq(menus.merchantId, merchant.id),
          isNull(orders.deletedAt)
        )
      )
      .limit(1);

    if (!orderCheck || orderCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Order not found or unauthorized" },
        },
        { status: 404 }
      );
    }

    const now = new Date();
    const { order } = await db.transaction(async (tx) => {
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: "completed",
          updatedAt: now,
        })
        .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)))
        .returning();

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

      console.log("Merchant marked order as paid:", {
        merchantId: merchant.id,
        order: updatedOrder,
        payment,
      });

      return {
        order: updatedOrder,
        payment,
      };
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order marked as paid and completed",
    });
  } catch (error) {
    console.error("Error marking order as paid:", error);

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
        error: { message: "Failed to mark order as paid" },
      },
      { status: 500 }
    );
  }
}
