/**
 * PATCH /api/sessions/[sessionId]
 * Update buyer session (e.g., table number)
 */

import { NextRequest, NextResponse } from "next/server";
import { SessionRepositoryImpl } from "../../../../data/repositories/session-repository";
import { SessionService } from "../../../../services/session-service";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from "../../../../lib/errors";

const sessionRepository = new SessionRepositoryImpl();
const sessionService = new SessionService(sessionRepository);

const updateSessionHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const { sessionId } = await params;

  try {
    const body = await request.json();
    const { table_number } = body;

    // Validate table number
    if (
      !table_number ||
      typeof table_number !== "number" ||
      table_number <= 0
    ) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Valid table number is required",
        400
      );
    }

    // Check local storage sessionId: validate in DB, create if doesn't exist
    await sessionService.findOrCreateSession(sessionId);

    // Now update the table number
    const updatedSession = await sessionService.updateTableNumber(
      sessionId,
      table_number
    );

    return NextResponse.json(
      createSuccessResponse({ session: updatedSession })
    );
  } catch (error) {
    console.error("Error updating session:", error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to update session",
      500
    );
  }
};

export { updateSessionHandler as PATCH };
