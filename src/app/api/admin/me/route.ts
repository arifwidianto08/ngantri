import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { admins } from "@/data/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function GET() {
  try {
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

    // Fetch full admin data from database
    const [admin] = await db
      .select()
      .from(admins)
      .where(and(eq(admins.id, session.adminId), isNull(admins.deletedAt)))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Admin not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        loginTime: session.loginTime,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
