/**
 * POST /api/payments/create
 * Create Xendit payment invoice for multiple orders (like Tokopedia/Shopee)
 */

import type { NextRequest } from "next/server";
import { OrderRepositoryImpl } from "@/data/repositories/order-repository";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
  ERROR_CODES,
} from "@/lib/errors";
import { db } from "@/lib/db";
import { orderPayments, orderPaymentItems } from "@/data/schema";

const orderRepository = new OrderRepositoryImpl();

const createPaymentHandler = async (request: NextRequest) => {
  const body = await request.json();
  const { order_ids } = body;

  if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
    return createErrorResponse(
      ERROR_CODES.BAD_REQUEST,
      "Order IDs array is required",
      400
    );
  }

  // Get all order details
  const orders = await Promise.all(
    order_ids.map((id) => orderRepository.findById(id))
  );

  const notFoundOrders = orders.filter((order) => !order);
  if (notFoundOrders.length > 0) {
    return createErrorResponse(
      ERROR_CODES.ORDER_NOT_FOUND,
      "One or more orders not found",
      404
    );
  }

  try {
    const { payments } = await db.transaction(async (tx) => {
      const payments = await tx
        .insert(orderPayments)
        .values(
          orders.map((order) => ({
            orderId: order?.id as string,
            paymentUrl: "",
            amount: order?.totalAmount as number,
            status: "pending",
            expiresAt: null,
          }))
        )
        .returning();

      // Create payment items for each order
      const paymentItems = await tx
        .insert(orderPaymentItems)
        .values(
          payments.map((payment) => ({
            paymentId: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
          }))
        )
        .returning();

      return {
        payments,
        paymentItems,
      };
    });

    return createSuccessResponse({
      orders,
      payments,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return createErrorResponse(
      ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      error instanceof Error ? error.message : "Failed to create payment",
      500
    );
  }
};

export const POST = withErrorHandler(createPaymentHandler);
