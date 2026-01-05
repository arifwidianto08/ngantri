/**
 * POST /api/orders/batch
 * Create multiple orders for different merchants in a single transaction
 * All orders succeed or all fail (atomic transaction)
 */

import type { NextRequest } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
  AppError,
} from "@/lib/errors";
import type { BatchOrderData } from "@/services/order-service";
import { OrderService } from "@/services/order-service";
import { OrderRepositoryImpl } from "@/data/repositories/order-repository";

const createBatchOrdersHandler = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as BatchOrderData;

    // Initialize service
    const orderRepository = new OrderRepositoryImpl();
    const orderService = new OrderService(orderRepository);

    // Create batch orders through service
    const results = await orderService.createBatchOrders(body);

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

    throw error;
  }
};

export const POST = withErrorHandler(createBatchOrdersHandler);
