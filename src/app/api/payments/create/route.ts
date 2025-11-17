/**
 * POST /api/payments/create
 * Create Xendit payment invoice for an order
 */

import type { NextRequest } from "next/server";
import { createPaymentInvoice } from "@/lib/xendit";
import { OrderRepositoryImpl } from "@/data/repositories/order-repository";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
  ERROR_CODES,
} from "@/lib/errors";
import { db } from "@/lib/db";
import { orderPayments } from "@/data/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

const orderRepository = new OrderRepositoryImpl();

const createPaymentHandler = async (request: NextRequest) => {
  const body = await request.json();
  const { order_id } = body;

  if (!order_id) {
    return createErrorResponse(
      ERROR_CODES.BAD_REQUEST,
      "Order ID is required",
      400
    );
  }

  // Get order details
  const order = await orderRepository.findById(order_id);
  if (!order) {
    return createErrorResponse(
      ERROR_CODES.ORDER_NOT_FOUND,
      "Order not found",
      404
    );
  }

  // Check if there's already an active (pending) payment
  const [existingPayment] = await db
    .select()
    .from(orderPayments)
    .where(
      and(
        eq(orderPayments.orderId, order_id),
        eq(orderPayments.status, "pending"),
        isNull(orderPayments.deletedAt)
      )
    )
    .orderBy(desc(orderPayments.createdAt))
    .limit(1);

  if (existingPayment) {
    // Check if payment is still valid (not expired)
    if (
      existingPayment.expiresAt &&
      new Date(existingPayment.expiresAt) > new Date()
    ) {
      return createSuccessResponse({
        order: {
          id: order_id,
          payment_id: existingPayment.xenditInvoiceId,
          payment_url: existingPayment.paymentUrl,
          expiry_date: existingPayment.expiresAt,
        },
      });
    }

    // Mark existing payment as expired
    await db
      .update(orderPayments)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(orderPayments.id, existingPayment.id));
  }

  try {
    // Get order items for invoice details
    const orderItems = await db.query.orderItems.findMany({
      where: (orderItems, { eq }) => eq(orderItems.orderId, order_id),
    });

    // Create Xendit invoice
    const invoice = await createPaymentInvoice({
      externalId: `ORDER-${order_id}-${Date.now()}`,
      amount: order.totalAmount,
      description: `Payment for Order #${order_id.slice(-8)}`,
      customerName: order.customerName || "Customer",
      customerPhone: order.customerPhone || undefined,
      items: orderItems.map((item) => ({
        name: item.menuName,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${order_id}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed?order_id=${order_id}`,
    });

    // Create payment record
    await db.insert(orderPayments).values({
      orderId: order_id,
      xenditInvoiceId: invoice.id,
      paymentUrl: invoice.invoice_url,
      amount: order.totalAmount,
      status: "pending",
      expiresAt: new Date(invoice.expiry_date),
    });

    return createSuccessResponse({
      order: {
        id: order_id,
        payment_id: invoice.id,
        payment_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date,
      },
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
