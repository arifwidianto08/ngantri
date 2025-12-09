import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { orders } from "@/data/schema";
import { eq, and, isNull, desc, sql, gt } from "drizzle-orm";

/**
 * GET /api/merchants/dashboard/orders
 * Get all orders for the authenticated merchant with pagination
 * Query params: ?status=pending|accepted|preparing|ready|completed&limit=20&cursor=orderId
 */
export async function GET(request: NextRequest) {
  try {
    const merchant = await requireMerchantAuth(request);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const cursorParam = searchParams.get("cursor");

    const limit = Math.min(
      limitParam ? Number.parseInt(limitParam, 10) : 20,
      100
    );

    // Build the where conditions
    const whereConditions = [
      eq(orders.merchantId, merchant.id),
      isNull(orders.deletedAt),
    ];

    // Add status filter if provided
    if (statusFilter && statusFilter !== "all") {
      whereConditions.push(eq(orders.status, statusFilter));
    }

    // Add cursor for pagination
    if (cursorParam) {
      whereConditions.push(gt(orders.id, cursorParam));
    }

    // Get orders for this merchant with pagination
    const merchantOrders = await db
      .select({
        orderId: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        sessionId: orders.sessionId,
      })
      .from(orders)
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit + 1);

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
    const totalCount = statusCounts.reduce((sum, item) => sum + item.count, 0);

    // Convert to object for easier lookup
    const counts = {
      all: totalCount,
      pending: statusCounts.find((s) => s.status === "pending")?.count || 0,
      accepted: statusCounts.find((s) => s.status === "accepted")?.count || 0,
      preparing: statusCounts.find((s) => s.status === "preparing")?.count || 0,
      ready: statusCounts.find((s) => s.status === "ready")?.count || 0,
      completed: statusCounts.find((s) => s.status === "completed")?.count || 0,
    };

    // Check if there are more results
    const hasMore = merchantOrders.length > limit;
    const data = hasMore ? merchantOrders.slice(0, -1) : merchantOrders;
    const nextCursor = hasMore ? data[data.length - 1]?.orderId : undefined;

    return NextResponse.json({
      success: true,
      data: {
        orders: data.map((order) => ({
          id: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          sessionId: order.sessionId,
        })),
        statusCounts: counts,
        pagination: {
          limit,
          cursor: nextCursor,
          hasMore,
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
