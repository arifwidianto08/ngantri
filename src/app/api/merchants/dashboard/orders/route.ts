import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { orders, orderPaymentItems, orderPayments } from "@/data/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

/**
 * GET /api/merchants/dashboard/orders
 * Get all orders for the authenticated merchant with pagination
 * Query params: ?status=pending|accepted|preparing|ready|completed&page=1&pageSize=10
 */
export async function GET(request: NextRequest) {
  try {
    const merchant = await requireMerchantAuth(request);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);

    const offset = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions = [
      eq(orders.merchantId, merchant.id),
      isNull(orders.deletedAt),
    ];

    if (statusFilter && statusFilter !== "all") {
      whereConditions.push(eq(orders.status, statusFilter));
    }

    const whereCondition = and(...whereConditions);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereCondition);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated orders with payment status
    const merchantOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        sessionId: orders.sessionId,
        paymentStatus:
          sql<string>`COALESCE(${orderPayments.status}, 'unpaid')`.as(
            "payment_status"
          ),
      })
      .from(orders)
      .leftJoin(orderPaymentItems, eq(orders.id, orderPaymentItems.orderId))
      .leftJoin(
        orderPayments,
        eq(orderPaymentItems.paymentId, orderPayments.id)
      )
      .where(whereCondition)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get status counts for all statuses
    const statusCounts = await db
      .select({
        status: orders.status,
        count: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .where(and(eq(orders.merchantId, merchant.id), isNull(orders.deletedAt)))
      .groupBy(orders.status);

    // Calculate total count
    const totalStatsCount = statusCounts.reduce(
      (sum, item) => sum + item.count,
      0
    );

    // Convert to object for easier lookup
    const counts = {
      all: totalStatsCount,
      pending: statusCounts.find((s) => s.status === "pending")?.count || 0,
      accepted: statusCounts.find((s) => s.status === "accepted")?.count || 0,
      preparing: statusCounts.find((s) => s.status === "preparing")?.count || 0,
      ready: statusCounts.find((s) => s.status === "ready")?.count || 0,
      completed: statusCounts.find((s) => s.status === "completed")?.count || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        orders: merchantOrders,
        statusCounts: counts,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching merchant orders:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
