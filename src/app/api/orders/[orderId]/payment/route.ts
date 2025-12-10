import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OrderRepositoryImpl } from "@/data/repositories/order-repository";
import { OrderService } from "@/services/order-service";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { orders, orderPayments } from "@/data/schema";
import { eq, and, isNull } from "drizzle-orm";

const orderRepository = new OrderRepositoryImpl();
const orderService = new OrderService(orderRepository);

/**
 * PATCH /api/orders/[orderId]/payment
 * Mark order as paid or unpaid (merchant only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const now = new Date();
    const { orderId } = await params;
    const authenticatedMerchant = await requireMerchantAuth(request);

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body, use defaults
    }
    const status = (body as { status?: string }).status || "paid";

    // Get order
    const order = await orderService.findOrderById(orderId);
    if (order.merchantId !== authenticatedMerchant.id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "You can only update your own orders" },
        },
        { status: 403 }
      );
    }

    // Get current order
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)));

    if (!currentOrder) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Order not found" },
        },
        { status: 404 }
      );
    }

    // Update only payment status, not order status
    await db
      .update(orderPayments)
      .set({
        status: status || "paid",
        paymentMethod: status === "paid" ? "cash" : null,
        paidAt: status === "paid" ? now : null,
        updatedAt: now,
      })
      .where(
        and(
          eq(orderPayments.orderId, order.id),
          isNull(orderPayments.deletedAt)
        )
      );

    const message =
      status === "paid"
        ? "Order payment marked as paid"
        : "Order payment marked as unpaid";

    return NextResponse.json({
      success: true,
      data: currentOrder,
      message,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required. Please log in." },
        },
        { status: 401 }
      );
    }

    console.error("Error updating order payment status:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to update order payment status" },
      },
      { status: 500 }
    );
  }
}
