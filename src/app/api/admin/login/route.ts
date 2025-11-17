import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Username and password are required" },
        },
        { status: 400 }
      );
    }

    if (validateAdminCredentials(username, password)) {
      await createAdminSession(username);

      return NextResponse.json({
        success: true,
        data: { message: "Login successful" },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Invalid credentials" },
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
