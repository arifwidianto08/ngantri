/**
 * POST /api/webhooks/xendit
 * Handle Xendit payment webhooks
 */

import type { NextRequest } from "next/server";
import { validateWebhookToken } from "@/lib/xendit";
import { db } from "@/lib/db";
import { orderPayments, orders } from "@/data/schema";
import { eq, and, isNull } from "drizzle-orm";
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

    // Find the order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, paymentRecord.orderId))
      .limit(1);

    if (!order) {
      console.error("Order not found:", paymentRecord.orderId);
      return createErrorResponse(
        ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404
      );
    }

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

    // Update order status if payment is completed
    if (status === "PAID" && order.status === "pending") {
      await db
        .update(orders)
        .set({
          status: "accepted",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, paymentRecord.orderId));
    } else if (status === "EXPIRED" || status === "FAILED") {
      // Optionally cancel order if payment failed/expired
      // Only if order is still pending
      if (order.status === "pending") {
        await db
          .update(orders)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, paymentRecord.orderId));
      }
    }

    console.log("Payment updated successfully:", {
      orderId: paymentRecord.orderId,
      paymentId: paymentRecord.id,
      status: paymentUpdate.status,
    });

    return createSuccessResponse({
      message: "Webhook processed successfully",
      order_id: paymentRecord.orderId,
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
