import type { NextRequest } from "next/server";
import { OrderRepositoryImpl } from "@/data/repositories/order-repository";
import { OrderService } from "@/services/order-service";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "@/lib/errors";

// Initialize services
const orderRepository = new OrderRepositoryImpl();
const orderService = new OrderService(orderRepository);

/**
 * Cancel an order
 * POST /api/orders/[orderId]/cancel
 *
 * Request body:
 * {
 *   session_id: string (required) - Buyer session ID for validation
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { session_id } = body;

    // Validate required fields
    if (!orderId) {
      return createErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        "Order ID is required",
        400
      );
    }

    if (!session_id) {
      return createErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        "Session ID is required",
        400
      );
    }

    // Get the order to verify it belongs to this session
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return createErrorResponse(
        ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404
      );
    }

    // Verify the order belongs to the buyer's session
    if (order.sessionId !== session_id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        "You do not have permission to cancel this order",
        403
      );
    }

    // Cancel the order using the service
    const cancelledOrder = await orderService.cancelOrder(orderId);

    // Get updated order items
    const items = await orderRepository.findOrderItems(orderId);

    return createSuccessResponse({
      ...cancelledOrder,
      items,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);

    // Check if this is a validation error from the service
    if (error instanceof Error) {
      if (error.message.includes("Cannot cancel order")) {
        return createErrorResponse(ERROR_CODES.BAD_REQUEST, error.message, 400);
      }
    }

    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to cancel order",
      500
    );
  }
}
