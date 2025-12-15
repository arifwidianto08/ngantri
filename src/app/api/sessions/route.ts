/**
 * POST /api/sessions
 * Create a new buyer session
 */

import { NextRequest } from "next/server";
import { SessionRepositoryImpl } from "../../../data/repositories/session-repository";
import { SessionService } from "../../../services/session-service";
import { createSuccessResponse, withErrorHandler } from "../../../lib/errors";

const sessionRepository = new SessionRepositoryImpl();
const sessionService = new SessionService(sessionRepository);

const createSessionHandler = async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));

  // If client provides sessionId from local storage, use that
  if (body.sessionId || body.session_id) {
    const sessionId = body.sessionId || body.session_id;
    const session = await sessionService.findOrCreateSession(sessionId);
    return createSuccessResponse(
      {
        session,
        message: "Session created successfully",
      },
      undefined,
      201
    );
  }

  // Create session with optional table number
  const sessionData = {
    tableNumber: body.table_number || body.tableNumber,
  };

  const session = await sessionService.createSession(sessionData);

  return createSuccessResponse(
    {
      session,
      message: "Session created successfully",
    },
    undefined,
    201
  );
};

export const POST = withErrorHandler(createSessionHandler);
