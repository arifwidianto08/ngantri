import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  merchants,
  orderPaymentItems,
  orderPayments,
  orderItems,
} from "@/data/schema";
import { desc, isNull, eq, sql, inArray } from "drizzle-orm";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  return username === adminUsername && password === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  try {
    // Get all orders with merchant info and payment status
    const allOrders = await db
      .select({
        id: orders.id,
        sessionId: orders.sessionId,
        merchantId: orders.merchantId,
        merchantName: merchants.name,
        status: orders.status,
        totalAmount: orders.totalAmount,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        notes: orders.notes,
        createdAt: orders.createdAt,
        paymentStatus:
          sql<string>`COALESCE(${orderPayments.status}, 'pending')`.as(
            "payment_status"
          ),
      })
      .from(orders)
      .leftJoin(merchants, eq(orders.merchantId, merchants.id))
      .leftJoin(orderPaymentItems, eq(orders.id, orderPaymentItems.orderId))
      .leftJoin(
        orderPayments,
        eq(orderPaymentItems.paymentId, orderPayments.id)
      )
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    // Get all order IDs
    const orderIds = allOrders.map((o) => o.id);

    // Fetch all items for these orders in one query
    const allItems =
      orderIds.length > 0
        ? await db
            .select()
            .from(orderItems)
            .where(inArray(orderItems.orderId, orderIds))
        : [];

    // Group items by order ID
    const itemsByOrderId = allItems.reduce((acc, item) => {
      if (!acc[item.orderId]) acc[item.orderId] = [];
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<string, typeof allItems>);

    // Combine orders with their items
    const ordersWithItems = allOrders.map((order) => ({
      ...order,
      items: itemsByOrderId[order.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
    });
  } catch (error) {
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
