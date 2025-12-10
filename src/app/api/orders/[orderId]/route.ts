import type { NextRequest } from "next/server";
import { OrderRepositoryImpl } from "@/data/repositories/order-repository";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "@/lib/errors";

const orderRepository = new OrderRepositoryImpl();

/**
 * GET /api/orders/[orderId]
 * Get a specific order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return createErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        "Order ID is required",
        400
      );
    }

    const order = await orderRepository.findById(orderId);

    if (!order) {
      return createErrorResponse(
        ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404
      );
    }

    // Get order items
    const items = await orderRepository.findOrderItems(orderId);

    // Get payment status from order_payments table
    const payments = await orderRepository.findPaymentsByOrderId(orderId);
    const latestPayment = payments[0]; // Most recent payment

    return createSuccessResponse({
      ...order,
      items,
      payment: latestPayment
        ? {
            id: latestPayment.id,
            url: latestPayment.paymentUrl,
            status: latestPayment.status,
            amount: latestPayment.amount,
            expiresAt: latestPayment.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to fetch order",
      500
    );
  }
}
