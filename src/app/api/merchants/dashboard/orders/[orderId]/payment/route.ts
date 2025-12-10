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

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body, use defaults
    }
    const status = (body as { status?: string }).status || "paid";

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
      // Get the current order
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)));

      // Update only payment status, not order status
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
        order: currentOrder,
        payment,
      };
    });

    const message =
      status === "paid"
        ? "Order payment marked as paid"
        : "Order payment marked as unpaid";

    return NextResponse.json({
      success: true,
      data: order,
      message,
    });
  } catch (error) {
    console.error("Error updating order payment status:", error);

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
        error: { message: "Failed to update order payment status" },
      },
      { status: 500 }
    );
  }
}
