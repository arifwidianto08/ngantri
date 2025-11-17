/**
 * POST /api/payments/create
 * Create Xendit payment invoice for multiple orders (like Tokopedia/Shopee)
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
import { orderPayments, orderPaymentItems } from "@/data/schema";
import { eq, and, inArray, isNull, desc } from "drizzle-orm";

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

  // Calculate total amount
  const totalAmount = orders.reduce(
    (sum, order) => sum + (order?.totalAmount || 0),
    0
  );

  // Check if there's already an active (pending) payment for these orders
  const existingPaymentItems = await db
    .select()
    .from(orderPaymentItems)
    .where(inArray(orderPaymentItems.orderId, order_ids));

  if (existingPaymentItems.length > 0) {
    // Get the payment details
    const paymentIds = [
      ...new Set(existingPaymentItems.map((item) => item.paymentId)),
    ];
    const existingPayments = await db
      .select()
      .from(orderPayments)
      .where(
        and(
          inArray(orderPayments.id, paymentIds),
          eq(orderPayments.status, "pending"),
          isNull(orderPayments.deletedAt)
        )
      )
      .orderBy(desc(orderPayments.createdAt))
      .limit(1);

    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      // Check if payment is still valid (not expired)
      if (
        existingPayment.expiresAt &&
        new Date(existingPayment.expiresAt) > new Date()
      ) {
        return createSuccessResponse({
          payment: {
            id: existingPayment.id,
            payment_id: existingPayment.xenditInvoiceId,
            payment_url: existingPayment.paymentUrl,
            amount: existingPayment.amount,
            expiry_date: existingPayment.expiresAt,
            order_ids,
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
  }

  try {
    // Get all order items for invoice details
    const allOrderItems = await db.query.orderItems.findMany({
      where: (orderItems, { inArray }) =>
        inArray(orderItems.orderId, order_ids),
    });

    // Get customer info from first order
    const firstOrder = orders[0];

    // Create Xendit invoice
    const invoice = await createPaymentInvoice({
      externalId: `PAYMENT-${Date.now()}`,
      amount: totalAmount,
      description: `Payment for ${order_ids.length} order(s)`,
      customerName: firstOrder?.customerName || "Customer",
      customerPhone: firstOrder?.customerPhone || undefined,
      items: allOrderItems.map((item) => ({
        name: item.menuName,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?payment_id=PENDING`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed?payment_id=PENDING`,
    });

    // Create payment record
    const [payment] = await db
      .insert(orderPayments)
      .values({
        xenditInvoiceId: invoice.id,
        paymentUrl: invoice.invoice_url,
        amount: totalAmount,
        status: "pending",
        expiresAt: new Date(invoice.expiry_date),
      })
      .returning();

    // Create payment items for each order
    await db.insert(orderPaymentItems).values(
      orders
        .filter((order): order is NonNullable<typeof order> => order !== null)
        .map((order) => ({
          paymentId: payment.id,
          orderId: order.id,
          amount: order.totalAmount,
        }))
    );

    return createSuccessResponse({
      payment: {
        id: payment.id,
        payment_id: invoice.id,
        payment_url: invoice.invoice_url,
        amount: totalAmount,
        expiry_date: invoice.expiry_date,
        order_ids,
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
