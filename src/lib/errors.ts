/**
 * Error handling utilities for consistent error responses and logging
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { PaginationMeta } from "./pagination";

// Standard error codes for the application
export const ERROR_CODES = {
  // General errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Authentication errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",

  // Business logic errors
  MERCHANT_NOT_FOUND: "MERCHANT_NOT_FOUND",
  MENU_NOT_FOUND: "MENU_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  MINIMUM_ORDER_NOT_MET: "MINIMUM_ORDER_NOT_MET",
  MERCHANT_INACTIVE: "MERCHANT_INACTIVE",
  MENU_UNAVAILABLE: "MENU_UNAVAILABLE",

  // File upload errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // External service errors
  WHATSAPP_API_ERROR: "WHATSAPP_API_ERROR",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Error response structure
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    path?: string;
  };
}

// Success response structure
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
  message?: string;
  timestamp: string;
}

// Combined response type
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Create standard error responses
 */
export const createErrorResponse = (
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: unknown,
  path?: string
): NextResponse<ErrorResponse> => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  return NextResponse.json(errorResponse, { status: statusCode });
};

/**
 * Create standard success responses
 */
export const createSuccessResponse = <T>(
  data: T,
  pagination?: PaginationMeta,
  message?: string,
  statusCode = 200
): NextResponse<SuccessResponse<T>> => {
  const successResponse: SuccessResponse<T> = {
    data,
    pagination,
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(successResponse, { status: statusCode });
};

/**
 * Handle Zod validation errors
 */
export const handleValidationError = (
  error: ZodError,
  path?: string
): NextResponse<ErrorResponse> => {
  const validationDetails = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  return createErrorResponse(
    ERROR_CODES.VALIDATION_ERROR,
    "Input validation failed",
    400,
    validationDetails,
    path
  );
};

/**
 * Handle application errors
 */
export const handleAppError = (
  error: AppError,
  path?: string
): NextResponse<ErrorResponse> => {
  return createErrorResponse(
    error.code,
    error.message,
    error.statusCode,
    error.details,
    path
  );
};

/**
 * Handle unknown errors
 */
export const handleUnknownError = (
  error: unknown,
  path?: string
): NextResponse<ErrorResponse> => {
  console.error("Unknown error:", error);

  // Log the full error for debugging
  if (error instanceof Error) {
    console.error("Error stack:", error.stack);
  }

  return createErrorResponse(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred",
    500,
    process.env.NODE_ENV === "development" ? error : undefined,
    path
  );
};

/**
 * Global error handler for API routes
 */
export const handleApiError = (
  error: unknown,
  path?: string
): NextResponse<ErrorResponse> => {
  if (error instanceof ZodError) {
    return handleValidationError(error, path);
  }

  if (error instanceof AppError) {
    return handleAppError(error, path);
  }

  return handleUnknownError(error, path);
};

/**
 * Common error factory functions
 */
export const errors = {
  notFound: (resource: string, id?: string) =>
    new AppError(
      ERROR_CODES.NOT_FOUND,
      `${resource}${id ? ` with ID ${id}` : ""} not found`,
      404
    ),

  unauthorized: (message = "Authentication required") =>
    new AppError(ERROR_CODES.UNAUTHORIZED, message, 401),

  forbidden: (message = "Access denied") =>
    new AppError(ERROR_CODES.FORBIDDEN, message, 403),

  badRequest: (message: string, details?: unknown) =>
    new AppError(ERROR_CODES.BAD_REQUEST, message, 400, details),

  conflict: (message: string, details?: unknown) =>
    new AppError(ERROR_CODES.CONFLICT, message, 409, details),

  validation: (message: string, details?: unknown) =>
    new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details),

  internal: (message = "Internal server error", details?: unknown) =>
    new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR, message, 500, details),

  // Business-specific errors
  merchantNotFound: (id?: string) =>
    new AppError(
      ERROR_CODES.MERCHANT_NOT_FOUND,
      `Merchant${id ? ` with ID ${id}` : ""} not found`,
      404
    ),

  menuNotFound: (id?: string) =>
    new AppError(
      ERROR_CODES.MENU_NOT_FOUND,
      `Menu item${id ? ` with ID ${id}` : ""} not found`,
      404
    ),

  orderNotFound: (id?: string) =>
    new AppError(
      ERROR_CODES.ORDER_NOT_FOUND,
      `Order${id ? ` with ID ${id}` : ""} not found`,
      404
    ),

  insufficientStock: (menuName: string, available: number) =>
    new AppError(
      ERROR_CODES.INSUFFICIENT_STOCK,
      `Insufficient stock for ${menuName}. Available: ${available}`,
      400,
      { menuName, available }
    ),

  minimumOrderNotMet: (minimum: string, current: string) =>
    new AppError(
      ERROR_CODES.MINIMUM_ORDER_NOT_MET,
      `Minimum order amount is ${minimum}. Current total: ${current}`,
      400,
      { minimum, current }
    ),

  merchantInactive: (merchantName: string) =>
    new AppError(
      ERROR_CODES.MERCHANT_INACTIVE,
      `Merchant ${merchantName} is currently inactive`,
      400,
      { merchantName }
    ),

  menuUnavailable: (menuName: string) =>
    new AppError(
      ERROR_CODES.MENU_UNAVAILABLE,
      `Menu item ${menuName} is currently unavailable`,
      400,
      { menuName }
    ),

  invalidCredentials: () =>
    new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email or password",
      401
    ),

  sessionExpired: () =>
    new AppError(
      ERROR_CODES.SESSION_EXPIRED,
      "Your session has expired. Please log in again.",
      401
    ),

  fileTooLarge: (maxSize: string) =>
    new AppError(
      ERROR_CODES.FILE_TOO_LARGE,
      `File size exceeds maximum allowed size of ${maxSize}`,
      400,
      { maxSize }
    ),

  invalidFileType: (allowedTypes: string[]) =>
    new AppError(
      ERROR_CODES.INVALID_FILE_TYPE,
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      400,
      { allowedTypes }
    ),

  uploadFailed: (reason?: string) =>
    new AppError(
      ERROR_CODES.UPLOAD_FAILED,
      `File upload failed${reason ? `: ${reason}` : ""}`,
      500,
      { reason }
    ),
};

/**
 * Async error handler wrapper for API routes
 */
export const withErrorHandler = <T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) => {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

/**
 * Logger utility for consistent error logging
 */
export const logger = {
  error: (
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ) => {
    console.error("[ERROR]", {
      message,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn("[WARN]", {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  info: (message: string, context?: Record<string, unknown>) => {
    console.info("[INFO]", {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[DEBUG]", {
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

/**
 * Type guard to check if response is an error
 */
export const isErrorResponse = (
  response: ApiResponse<unknown>
): response is ErrorResponse => {
  return !response.success;
};

/**
 * Type guard to check if response is successful
 */
export const isSuccessResponse = <T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> => {
  return response.success;
};
