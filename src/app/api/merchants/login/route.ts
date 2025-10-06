/**
 * POST /api/merchants/login
 * Merchant login endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { MerchantRepositoryImpl } from "../../../../data/repositories/MerchantRepository";
import { MerchantService } from "../../../../services/MerchantService";
import {
  createSuccessResponse,
  handleApiError,
  withErrorHandler,
} from "../../../../lib/errors";
import { loginMerchantSchema } from "../../../../lib/validation";

const merchantRepository = new MerchantRepositoryImpl();
const merchantService = new MerchantService(merchantRepository);

const loginHandler = async (request: NextRequest) => {
  const body = await request.json();

  // Validate input - accept both phone_number and phoneNumber for flexibility
  const loginData = {
    phoneNumber: body.phoneNumber || body.phone_number,
    password: body.password,
  };

  if (!loginData.phoneNumber || !loginData.password) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Phone number and password are required" },
      },
      { status: 400 }
    );
  }

  // Login merchant
  const result = await merchantService.login(loginData);

  // Remove password hash from response
  const { passwordHash, ...merchantData } = result.merchant;

  // Create response with success data
  const response = NextResponse.json({
    success: true,
    data: {
      merchant: merchantData,
      message: "Login successful",
    },
  });

  // Set secure session cookie
  response.cookies.set("merchant-session", merchantData.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
};

export const POST = withErrorHandler(loginHandler);
