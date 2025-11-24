import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireMerchantAuth } from "@/lib/merchant-auth";
import { db } from "@/lib/db";
import { orders, orderItems, menus } from "@/data/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const merchant = await requireMerchantAuth(request);
    const { orderId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Status is required" },
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid status" },
        },
        { status: 400 }
      );
    }

    // Verify the order belongs to this merchant
    const orderCheck = await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(menus, eq(orderItems.menuId, menus.id))
      .where(
        and(
          eq(orders.id, orderId),
          eq(menus.merchantId, merchant.id),
          isNull(orders.deletedAt)
        )
      )
      .limit(1);

    if (!orderCheck || orderCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Order not found or unauthorized" },
        },
        { status: 404 }
      );
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      success: true,
      data: { message: "Order status updated" },
    });
  } catch (error) {
    console.error("Error updating order status:", error);

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
        error: { message: "Failed to update order status" },
      },
      { status: 500 }
    );
  }
}
