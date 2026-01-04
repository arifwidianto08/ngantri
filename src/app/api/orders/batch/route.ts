/**
 * POST /api/orders/batch
 * Create multiple orders for different merchants in a single transaction
 * All orders succeed or all fail (atomic transaction)
 */

import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  buyerSessions,
  merchants,
  menus,
} from "@/data/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
  ERROR_CODES,
  AppError,
  errors,
} from "@/lib/errors";
import { v4 as uuidv4 } from "uuid";

interface BatchOrderItem {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  menuImageUrl?: string;
}

interface BatchOrderRequest {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  ordersByMerchant: Record<
    string,
    {
      merchantName: string;
      items: BatchOrderItem[];
    }
  >;
}

interface BatchOrderResult {
  merchantId: string;
  merchantName: string;
  orderId: string;
  totalAmount: number;
}

const createBatchOrdersHandler = async (request: NextRequest) => {
  const body = (await request.json()) as BatchOrderRequest;
  const { sessionId, customerName, customerPhone, notes, ordersByMerchant } =
    body;

  // Validate input
  if (!sessionId || !customerName || !customerPhone || !ordersByMerchant) {
    return createErrorResponse(
      ERROR_CODES.BAD_REQUEST,
      "Missing required fields",
      400
    );
  }

  if (Object.keys(ordersByMerchant).length === 0) {
    return createErrorResponse(
      ERROR_CODES.BAD_REQUEST,
      "No orders provided",
      400
    );
  }

  try {
    // Verify session exists
    const session = await db
      .select()
      .from(buyerSessions)
      .where(eq(buyerSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        "Session not found",
        404
      );
    }

    // Execute all orders in a single transaction
    const results = await db.transaction(async (tx) => {
      const createdOrders: BatchOrderResult[] = [];

      const merchantEntries = Object.entries(ordersByMerchant);
      const merchantIds = merchantEntries.map(([merchantId]) => merchantId);

      // Preload merchants once (avoid SELECT in loop)
      const merchantRows = await tx
        .select({
          id: merchants.id,
          name: merchants.name,
          isAvailable: merchants.isAvailable,
        })
        .from(merchants)
        .where(and(inArray(merchants.id, merchantIds), isNull(merchants.deletedAt)));

      const merchantsById = new Map(
        merchantRows.map((m) => [m.id, { name: m.name, isAvailable: m.isAvailable }])
      );

      // Preload menus once (avoid SELECT in loop)
      const allMenuIds = Array.from(
        new Set(
          merchantEntries.flatMap(([, { items }]) =>
            (items ?? []).map((i) => i.menuId)
          )
        )
      );

      const menuRows = allMenuIds.length
        ? await tx
            .select({
              id: menus.id,
              name: menus.name,
              isAvailable: menus.isAvailable,
              merchantId: menus.merchantId,
            })
            .from(menus)
            .where(and(inArray(menus.id, allMenuIds), isNull(menus.deletedAt)))
        : [];

      const menusById = new Map(
        menuRows.map((m) => [
          m.id,
          { name: m.name, isAvailable: m.isAvailable, merchantId: m.merchantId },
        ])
      );

      // Process each merchant's orders
      for (const [merchantId, { merchantName, items }] of merchantEntries) {
        if (!items || items.length === 0) {
          throw errors.validation(
            `No items provided for merchant ${merchantName}`
          );
        }

        // Verify merchant exists (in-memory lookup)
        const merchantRecord = merchantsById.get(merchantId);
        if (!merchantRecord) {
          throw errors.merchantNotFound(merchantId);
        }

        if (!merchantRecord.isAvailable) {
          throw errors.merchantInactive(merchantRecord.name);
        }

        // Validate menu item availability for this merchant (in-memory lookups)
        for (const item of items) {
          const menuRecord = menusById.get(item.menuId);
          if (!menuRecord || menuRecord.merchantId !== merchantId) {
            throw errors.menuNotFound(item.menuId);
          }

          if (!menuRecord.isAvailable) {
            throw errors.menuUnavailable(menuRecord.name || item.menuName);
          }
        }

        // Calculate total amount
        const totalAmount = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );

        // Create order
        const orderId = uuidv4();
        await tx.insert(orders).values({
          id: orderId,
          sessionId,
          merchantId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          totalAmount,
          notes: notes || null,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });

        // Create order items in bulk
        const itemsToInsert = items.map((item) => ({
          id: uuidv4(),
          orderId,
          menuId: item.menuId,
          menuName: item.menuName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
          menuImageUrl: item.menuImageUrl || null,
          createdAt: new Date(),
        }));

        await tx.insert(orderItems).values(itemsToInsert);

        createdOrders.push({
          merchantId,
          merchantName,
          orderId,
          totalAmount,
        });
      }

      return createdOrders;
    });

    return createSuccessResponse({
      orders: results,
      totalOrders: results.length,
      message: "All orders created successfully",
    });
  } catch (error) {
    console.error("Error creating batch orders:", error);

    if (error instanceof AppError) {
      return createErrorResponse(
        error.code,
        error.message,
        error.statusCode,
        error.details
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, error.message, 404);
    }

    return createErrorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to create orders", 500);
  }
};

export const POST = withErrorHandler(createBatchOrdersHandler);
