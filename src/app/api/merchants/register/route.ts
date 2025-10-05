import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createMerchantSchema,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation";
import { MerchantRepositoryImpl } from "@/data/repositories/MerchantRepository";

const merchantRepo = new MerchantRepositoryImpl();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createMerchantSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          "Invalid input: " +
            validationResult.error.issues.map((i) => i.message).join(", ")
        ),
        { status: 400 }
      );
    }

    const { phone_number, password, name, description } = validationResult.data;

    // Check if merchant already exists
    const existingMerchant = await merchantRepo.findByPhoneNumber(phone_number);
    if (existingMerchant) {
      return NextResponse.json(
        createErrorResponse("Phone number already registered"),
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get next merchant number
    const merchantNumber = await merchantRepo.getNextMerchantNumber();

    // Create merchant
    const newMerchant = await merchantRepo.create({
      phoneNumber: phone_number,
      passwordHash,
      merchantNumber,
      name,
      description: description || null,
      imageUrl: null,
      isAvailable: true,
    });

    // Return merchant data (excluding password hash)
    const responseData = {
      id: newMerchant.id,
      phone_number: newMerchant.phoneNumber,
      merchant_number: newMerchant.merchantNumber,
      name: newMerchant.name,
      description: newMerchant.description,
      image_url: newMerchant.imageUrl,
      is_available: newMerchant.isAvailable,
      created_at: newMerchant.createdAt.toISOString(),
      updated_at: newMerchant.updatedAt.toISOString(),
    };

    return NextResponse.json(createSuccessResponse(responseData), {
      status: 201,
    });
  } catch (error) {
    console.error("Error registering merchant:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), {
      status: 500,
    });
  }
}
