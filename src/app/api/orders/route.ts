import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OrderRepositoryImpl } from "../../../data/repositories/order-repository";
import { OrderService } from "../../../services/order-service";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../lib/errors";
import { requireMerchantAuth } from "../../../lib/merchant-auth";

const orderRepository = new OrderRepositoryImpl();
const orderService = new OrderService(orderRepository);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { sessionId, merchantId, items } = body;

    if (
      !sessionId ||
      !merchantId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required fields: sessionId, merchantId, and items",
        400
      );
    }

    // Create order using service
    const orderData = {
      sessionId,
      merchantId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      items: items.map(
        (item: {
          menuId: string;
          menuName: string;
          quantity: number;
          unitPrice: number;
          menuImageUrl?: string;
        }) => ({
          menuId: item.menuId,
          menuName: item.menuName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          menuImageUrl: item.menuImageUrl,
        })
      ),
      notes: body.notes,
    };

    const order = await orderService.createOrder(orderData);

    return createSuccessResponse(
      {
        order,
        message: "Order created successfully",
      },
      "Order created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to create order",
      500
    );
  }
}

/**
 * GET /api/orders
 * Get orders - supports filtering by session_id, status, or merchant auth
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const statusParam = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const cursorParam = searchParams.get("cursor");
    const directionParam = searchParams.get("direction");

    const limit = limitParam
      ? Math.min(Number.parseInt(limitParam, 10), 100)
      : 50;
    const direction: "asc" | "desc" =
      directionParam === "asc" || directionParam === "desc"
        ? directionParam
        : "desc";

    // If session_id is provided, fetch orders for that session (buyer view)
    if (sessionId) {
      const result = await orderService.findOrdersBySession(sessionId, {
        limit,
        direction,
        ...(cursorParam && { cursor: cursorParam }),
        ...(statusParam && { status: statusParam }),
      });

      // Fetch items and payment status for all orders in one query
      const orderIds = result.data.map((o) => o.id);
      const ordersWithDetails =
        await orderRepository.findOrdersWithItemsAndPaymentStatus(orderIds);

      // Merge with original order data to preserve pagination info
      const ordersWithItems = result.data.map((order) => {
        const details = ordersWithDetails.find((d) => d.order.id === order.id);
        return {
          ...order,
          items: details?.items || [],
          paymentStatus: details?.paymentStatus || "unpaid",
        };
      });

      return NextResponse.json({
        success: true,
        data: ordersWithItems,
      });
    }

    // Otherwise, get orders for authenticated merchant
    const authenticatedMerchant = await requireMerchantAuth(request);

    // Get orders for this merchant with pagination
    const paginationParams = {
      limit,
      direction,
      ...(cursorParam && { cursor: cursorParam }),
      ...(statusParam && { status: statusParam }),
    };

    const result = await orderService.findOrdersByMerchant(
      authenticatedMerchant.id,
      paginationParams
    );

    // Fetch items and payment status for all orders in one query
    const orderIds = result.data.map((o) => o.id);
    const ordersWithDetails =
      await orderRepository.findOrdersWithItemsAndPaymentStatus(orderIds);

    // Merge with original order data to preserve pagination info
    const ordersWithItems = result.data.map((order) => {
      const details = ordersWithDetails.find((d) => d.order.id === order.id);
      return {
        ...order,
        items: details?.items || [],
        paymentStatus: details?.paymentStatus || "unpaid",
      };
    });

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required. Please log in." },
        },
        { status: 401 }
      );
    }

    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to fetch orders" },
      },
      { status: 500 }
    );
  }
}
