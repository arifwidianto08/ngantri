/**
 * POST /api/webhooks/xendit
 * Handle Xendit payment webhooks for multi-order payments
 */

import type { NextRequest } from "next/server";
import { validateWebhookToken } from "@/lib/xendit";
import { db } from "@/lib/db";
import { orderPayments, orderPaymentItems, orders } from "@/data/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook token
    const callbackToken = request.headers.get("x-callback-token") || "";
    if (!validateWebhookToken(callbackToken)) {
      console.error("Invalid webhook token");
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, "Unauthorized", 401);
    }

    // Extract payment details from webhook
    const {
      id: invoiceId,
      external_id: externalId,
      status,
      payment_method: paymentMethod,
      paid_at: paidAt,
    } = body;

    console.log("Xendit webhook received:", {
      invoiceId,
      externalId,
      status,
      paymentMethod,
    });

    // Find payment record by Xendit invoice ID
    const [paymentRecord] = await db
      .select()
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.xenditInvoiceId, invoiceId),
          isNull(orderPayments.deletedAt)
        )
      )
      .limit(1);

    if (!paymentRecord) {
      console.error("Payment record not found:", invoiceId);
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        "Payment record not found",
        404
      );
    }

    // Find all orders linked to this payment
    const paymentItems = await db
      .select()
      .from(orderPaymentItems)
      .where(eq(orderPaymentItems.paymentId, paymentRecord.id));

    const orderIds = paymentItems.map((item) => item.orderId);

    if (orderIds.length === 0) {
      console.error("No orders found for payment:", paymentRecord.id);
      return createErrorResponse(
        ERROR_CODES.ORDER_NOT_FOUND,
        "No orders found for this payment",
        404
      );
    }

    const relatedOrders = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, orderIds));

    // Update payment record based on status
    const paymentUpdate: Record<string, string | Date | object> = {
      updatedAt: new Date(),
      webhookData: body, // Store full webhook payload
    };

    if (status === "PAID") {
      paymentUpdate.status = "paid";
      paymentUpdate.paymentMethod = paymentMethod;
      paymentUpdate.paidAt = paidAt ? new Date(paidAt) : new Date();
    } else if (status === "EXPIRED") {
      paymentUpdate.status = "expired";
    } else if (status === "FAILED") {
      paymentUpdate.status = "failed";
    }

    await db
      .update(orderPayments)
      .set(paymentUpdate)
      .where(eq(orderPayments.id, paymentRecord.id));

    // Update all related orders based on payment status
    if (status === "PAID") {
      // Update all pending orders to accepted
      const pendingOrderIds = relatedOrders
        .filter((order) => order.status === "pending")
        .map((order) => order.id);

      if (pendingOrderIds.length > 0) {
        await db
          .update(orders)
          .set({
            status: "accepted",
            updatedAt: new Date(),
          })
          .where(inArray(orders.id, pendingOrderIds));
      }
    } else if (status === "EXPIRED" || status === "FAILED") {
      // Cancel all pending orders
      const pendingOrderIds = relatedOrders
        .filter((order) => order.status === "pending")
        .map((order) => order.id);

      if (pendingOrderIds.length > 0) {
        await db
          .update(orders)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(inArray(orders.id, pendingOrderIds));
      }
    }

    console.log("Payment updated successfully:", {
      orderIds,
      paymentId: paymentRecord.id,
      status: paymentUpdate.status,
    });

    return createSuccessResponse({
      message: "Webhook processed successfully",
      order_ids: orderIds,
      payment_id: paymentRecord.id,
      status: paymentUpdate.status,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return createErrorResponse(
      ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      error instanceof Error ? error.message : "Webhook processing failed",
      500
    );
  }
}
