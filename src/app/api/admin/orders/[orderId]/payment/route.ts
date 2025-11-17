import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderPayments } from "@/data/schema";
import { eq, and, isNull } from "drizzle-orm";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!checkAuth(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  try {
    const { orderId } = await params;
    const now = new Date();
    const { order } = await db.transaction(async (tx) => {
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: "completed",
          updatedAt: now,
        })
        .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)))
        .returning();

      // Find and update related order_payments
      const [payment] = await tx
        .update(orderPayments)
        .set({
          status: "paid",
          paymentMethod: "cash",
          paidAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(orderPayments.orderId, orderId),
            isNull(orderPayments.deletedAt)
          )
        )
        .returning();

      console.log("Updated Order and Payment : ", {
        order: updatedOrder,
        payment,
      });

      return {
        order: updatedOrder,
        payment,
      };
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order marked as paid and completed",
    });
  } catch (error) {
    console.error("Error marking order as paid:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to mark order as paid" },
      },
      { status: 500 }
    );
  }
}
