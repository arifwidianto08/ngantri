/**
 * POST /api/merchants/login
 * Merchant login endpoint
 */

import { NextRequest } from "next/server";
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

  // Validate input
  const validatedData = loginMerchantSchema.parse(body);

  // Transform validated data to match service interface
  const loginData = {
    phoneNumber: validatedData.phone_number,
    password: validatedData.password,
  };

  // Login merchant
  const result = await merchantService.login(loginData);

  // Remove password hash from response
  const { passwordHash, ...merchantData } = result.merchant;

  return createSuccessResponse({
    merchant: merchantData,
    message: "Login successful",
  });
};

export const POST = withErrorHandler(loginHandler);
