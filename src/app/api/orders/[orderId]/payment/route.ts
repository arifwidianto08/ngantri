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
 * Mark order as paid (merchant only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const now = new Date();
    const { orderId } = await params;
    const authenticatedMerchant = await requireMerchantAuth(request);

    // Get order
    const order = await orderService.findOrderById(orderId);
    if (order.merchantId !== authenticatedMerchant.id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "You can only mark your own orders as paid" },
        },
        { status: 403 }
      );
    }

    // Update order status to completed
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "completed",
        updatedAt: now,
      })
      .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Order not found" },
        },
        { status: 404 }
      );
    }

    // Update order_payments using orderId through junction table
    await db
      .update(orderPayments)
      .set({
        status: "paid",
        paymentMethod: "cash",
        paidAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(orderPayments.orderId, order.id),
          isNull(orderPayments.deletedAt)
        )
      );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Order marked as paid and completed",
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
