import { NextRequest, NextResponse } from "next/server";
import { OrderRepositoryImpl } from "@/data/repositories/OrderRepository";
import { OrderService } from "@/services/OrderService";
import { handleApiError } from "@/lib/errors";
import { requireMerchantAuth } from "@/lib/merchantAuth";

// Initialize services
const orderRepository = new OrderRepositoryImpl();
const orderService = new OrderService(orderRepository);

/**
 * Update order status
 * PATCH /api/orders/[orderId]/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Authenticate merchant from session
    const authenticatedMerchant = await requireMerchantAuth(request);

    const { orderId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify merchant owns the order
    const existingOrder = await orderService.findOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.merchantId !== authenticatedMerchant.id) {
      return NextResponse.json(
        { error: "Unauthorized: Order does not belong to this merchant" },
        { status: 403 }
      );
    }

    // Update order status
    const updatedOrder = await orderService.updateOrderStatus(orderId, status);

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    return handleApiError(error);
  }
}

/**
 * Get order status
 * GET /api/orders/[orderId]/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get order details
    const order = await orderService.findOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        merchantId: order.merchantId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
