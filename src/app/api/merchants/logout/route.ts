import { NextResponse } from "next/server";

/**
 * POST /api/merchants/logout
 * Merchant logout endpoint
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: {
      message: "Logout successful",
    },
  });

  // Clear the session cookie
  response.cookies.set("merchant-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}
