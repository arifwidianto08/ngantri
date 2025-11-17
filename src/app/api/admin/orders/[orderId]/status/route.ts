import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { orders } from "@/data/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireAdminAuth();

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
        error: { message: "Failed to update order status" },
      },
      { status: 500 }
    );
  }
}
