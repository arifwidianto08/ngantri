import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { orders, orderItems, menus } from "@/data/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

/**
 * GET /api/merchants/dashboard/orders
 * Get all orders for the authenticated merchant
 * Query params: ?status=pending|accepted|preparing|ready|completed
 */
export async function GET(request: NextRequest) {
  try {
    const merchant = await requireMerchantAuth(request);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // Build the where conditions
    const whereConditions = [
      eq(menus.merchantId, merchant.id),
      isNull(orders.deletedAt),
    ];

    // Add status filter if provided
    if (statusFilter && statusFilter !== "all") {
      whereConditions.push(eq(orders.status, statusFilter));
    }

    // Get orders with merchant's items
    const merchantOrders = await db
      .selectDistinct({
        orderId: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        sessionId: orders.sessionId,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(menus, eq(orderItems.menuId, menus.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt));

    // Get status counts for all statuses
    const statusCounts = await db
      .select({
        status: orders.status,
        count: sql<number>`count(distinct ${orders.id})::int`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(menus, eq(orderItems.menuId, menus.id))
      .where(and(eq(menus.merchantId, merchant.id), isNull(orders.deletedAt)))
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

    return NextResponse.json({
      success: true,
      data: {
        orders: merchantOrders.map((order) => ({
          id: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          sessionId: order.sessionId,
        })),
        statusCounts: counts,
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
