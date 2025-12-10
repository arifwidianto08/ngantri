import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { orders, menus, menuCategories } from "@/data/schema";
import { eq, and, isNull, sql, gte } from "drizzle-orm";

/**
 * GET /api/merchants/dashboard/stats
 * Get dashboard statistics for authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    const merchant = await requireMerchantAuth(request);

    // Get total orders count and revenue
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        pendingOrders: sql<number>`count(case when ${orders.status} = 'pending' then 1 end)::int`,
        completedOrders: sql<number>`count(case when ${orders.status} = 'completed' then 1 end)::int`,
      })
      .from(orders)
      .where(and(eq(orders.merchantId, merchant.id), isNull(orders.deletedAt)));

    // Get orders by status
    const ordersByStatus = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(eq(orders.merchantId, merchant.id), isNull(orders.deletedAt)))
      .groupBy(orders.status);

    // Get revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueByDay = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`sum(${orders.totalAmount})::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchant.id),
          isNull(orders.deletedAt),
          gte(orders.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    // Get total menus and categories
    const [menuStats] = await db
      .select({
        totalMenus: sql<number>`count(distinct ${menus.id})::int`,
        availableMenus: sql<number>`count(distinct case when ${menus.isAvailable} = true then ${menus.id} end)::int`,
      })
      .from(menus)
      .where(and(eq(menus.merchantId, merchant.id), isNull(menus.deletedAt)));

    const [categoryStats] = await db
      .select({
        totalCategories: sql<number>`count(*)::int`,
      })
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.merchantId, merchant.id),
          isNull(menuCategories.deletedAt)
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalRevenue: orderStats[0]?.totalRevenue || 0,
          pendingOrders: orderStats[0]?.pendingOrders || 0,
          completedOrders: orderStats[0]?.completedOrders || 0,
          totalMenus: menuStats?.totalMenus || 0,
          availableMenus: menuStats?.availableMenus || 0,
          totalCategories: categoryStats?.totalCategories || 0,
        },
        ordersByStatus: ordersByStatus || [],
        revenueByDay: revenueByDay || [],
      },
    });
  } catch (error) {
    console.error("Error fetching merchant dashboard stats:", error);

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
