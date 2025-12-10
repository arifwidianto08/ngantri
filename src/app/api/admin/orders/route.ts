import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  merchants,
  orderPaymentItems,
  orderPayments,
  orderItems,
} from "@/data/schema";
import { desc, isNull, eq, sql, and, count } from "drizzle-orm";
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
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);

    const offset = (page - 1) * pageSize;

    // Build where condition using Drizzle AND
    const whereConditions = [isNull(orders.deletedAt)];
    if (statusFilter && statusFilter !== "all") {
      whereConditions.push(eq(orders.status, statusFilter));
    }
    const whereCondition = and(...whereConditions);

    // Get total count for pagination
    const countResult = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(whereCondition);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated orders with all items in a single query using JSON aggregation
    const ordersWithAllData = await db
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
        items: sql<
          Array<{
            id: string;
            menuName: string;
            quantity: number;
            unitPrice: number;
            subtotal: number;
          }>
        >`COALESCE(json_agg(json_build_object(
          'id', ${orderItems.id},
          'menuName', ${orderItems.menuName},
          'quantity', ${orderItems.quantity},
          'unitPrice', ${orderItems.unitPrice},
          'subtotal', ${orderItems.subtotal}
        ) ORDER BY ${orderItems.createdAt}) FILTER (WHERE ${orderItems.id} IS NOT NULL), '[]'::json)`,
      })
      .from(orders)
      .leftJoin(merchants, eq(orders.merchantId, merchants.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(orderPaymentItems, eq(orders.id, orderPaymentItems.orderId))
      .leftJoin(
        orderPayments,
        eq(orderPaymentItems.paymentId, orderPayments.id)
      )
      .where(whereCondition)
      .groupBy(orders.id, merchants.id, orderPayments.id)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset);

    const ordersWithItems = ordersWithAllData;

    // Get stats (always return stats for all statuses)
    const statusCounts = await db
      .select({
        status: orders.status,
        count: count(orders.id),
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

    const totalStatsCount = statusCounts.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const stats = {
      total: totalStatsCount,
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
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
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
