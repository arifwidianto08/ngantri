import { NextRequest, NextResponse } from "next/server";
import { OrderRepositoryImpl } from "../../../data/repositories/OrderRepository";
import { OrderService } from "../../../services/OrderService";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../lib/errors";
import { requireMerchantAuth } from "../../../lib/merchantAuth";

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
 * Get orders for the authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate merchant from session
    const authenticatedMerchant = await requireMerchantAuth(request);

    // Get orders for this merchant with pagination
    const paginationParams = {
      limit: 50, // Default limit
      cursor: undefined, // No cursor for first page
      direction: "desc" as const, // Show newest orders first
    };

    const result = await orderService.findOrdersByMerchant(
      authenticatedMerchant.id,
      paginationParams
    );

    return NextResponse.json({
      success: true,
      data: result.data,
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
