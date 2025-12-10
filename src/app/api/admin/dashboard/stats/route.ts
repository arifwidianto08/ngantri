import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { orders, merchants, menus, menuCategories } from "@/data/schema";
import { isNull, eq, gte, sql, and, count } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdminAuth();

    // Get total orders
    const totalOrdersResult = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(isNull(orders.deletedAt));
    const totalOrders = totalOrdersResult[0]?.count || 0;

    // Get total revenue
    const totalRevenueResult = await db
      .select({
        sum: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(isNull(orders.deletedAt));
    const totalRevenue = totalRevenueResult[0]?.sum || 0;

    // Get pending orders
    const pendingOrdersResult = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(and(isNull(orders.deletedAt), eq(orders.status, "pending")));
    const pendingOrders = pendingOrdersResult[0]?.count || 0;

    // Get completed orders
    const completedOrdersResult = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(and(isNull(orders.deletedAt), eq(orders.status, "completed")));
    const completedOrders = completedOrdersResult[0]?.count || 0;

    // Get total merchants
    const totalMerchantsResult = await db
      .select({ count: count(orders.id) })
      .from(merchants)
      .where(isNull(merchants.deletedAt));
    const totalMerchants = totalMerchantsResult[0]?.count || 0;

    // Get total menus
    const totalMenusResult = await db
      .select({ count: count(orders.id) })
      .from(menus)
      .where(isNull(menus.deletedAt));
    const totalMenus = totalMenusResult[0]?.count || 0;

    // Get total categories
    const totalCategoriesResult = await db
      .select({ count: count(orders.id) })
      .from(menuCategories)
      .where(isNull(menuCategories.deletedAt));
    const totalCategories = totalCategoriesResult[0]?.count || 0;

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        merchantName: merchants.name,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(merchants, eq(orders.merchantId, merchants.id))
      .where(isNull(orders.deletedAt))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(10);

    // Get orders by status
    const ordersByStatus = await db
      .select({
        status: orders.status,
        count: count(orders.id),
      })
      .from(orders)
      .where(isNull(orders.deletedAt))
      .groupBy(orders.status);

    // Get revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(
        and(isNull(orders.deletedAt), gte(orders.createdAt, thirtyDaysAgo))
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt}) DESC`);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        totalMerchants,
        totalMenus,
        totalCategories,
        recentOrders,
        ordersByStatus,
        revenueByDay,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Unauthorized" },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to fetch dashboard stats" },
      },
      { status: 500 }
    );
  }
}
