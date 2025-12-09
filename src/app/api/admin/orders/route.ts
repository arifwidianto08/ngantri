import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  merchants,
  orderPaymentItems,
  orderPayments,
  orderItems,
} from "@/data/schema";
import { desc, isNull, eq, sql, inArray } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Unauthorized" },
      },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // Build where conditions
    const whereConditions = [isNull(orders.deletedAt)];
    if (statusFilter && statusFilter !== "all") {
      whereConditions.push(eq(orders.status, statusFilter));
    }

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
          sql<string>`COALESCE(${orderPayments.status}, 'unpaid')`.as(
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
      .where(
        whereConditions.length > 1
          ? sql`${whereConditions.join(" AND ")}`
          : whereConditions[0]
      )
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

    // Get stats (always return stats for all statuses)
    const statusCounts = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(isNull(orders.deletedAt))
      .groupBy(orders.status);

    const paymentStats = await db
      .select({
        unpaidCount: sql<number>`count(CASE WHEN COALESCE(${orderPayments.status}, 'unpaid') != 'paid' THEN 1 END)::int`,
      })
      .from(orders)
      .leftJoin(orderPaymentItems, eq(orders.id, orderPaymentItems.orderId))
      .leftJoin(
        orderPayments,
        eq(orderPaymentItems.paymentId, orderPayments.id)
      )
      .where(isNull(orders.deletedAt));

    const totalCount = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const stats = {
      total: totalCount,
      pending: statusCounts.find((s) => s.status === "pending")?.count || 0,
      accepted: statusCounts.find((s) => s.status === "accepted")?.count || 0,
      preparing: statusCounts.find((s) => s.status === "preparing")?.count || 0,
      ready: statusCounts.find((s) => s.status === "ready")?.count || 0,
      completed: statusCounts.find((s) => s.status === "completed")?.count || 0,
      cancelled: statusCounts.find((s) => s.status === "cancelled")?.count || 0,
      unpaid: paymentStats[0]?.unpaidCount || 0,
    };

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
      stats,
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
