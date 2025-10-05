/**
 * Pagination utilities for cursor-based pagination with UUIDv7
 * UUIDv7 is naturally sortable by creation time
 */

import { z } from "zod";

// Default pagination configuration
export const PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
} as const;

// Pagination query schema for API validation
export const paginationQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z
    .string()
    .optional()
    .default(PAGINATION_CONFIG.defaultLimit.toString())
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number().min(PAGINATION_CONFIG.minLimit).max(PAGINATION_CONFIG.maxLimit)
    ),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// Cursor pagination parameters for database queries
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction: "asc" | "desc";
}

// Paginated result structure
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    totalCount?: number;
    limit: number;
    direction: "asc" | "desc";
    currentPage?: number;
    totalPages?: number;
  };
}

// Metadata for pagination info
export interface PaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
  totalCount?: number;
  limit: number;
  direction: "asc" | "desc";
  currentPage?: number;
  totalPages?: number;
}

/**
 * Create cursor pagination parameters from query
 * @param query - Query parameters from request
 * @returns Validated pagination parameters
 */
export const createPaginationParams = (
  query: Record<string, unknown>
): CursorPaginationParams => {
  const validated = paginationQuerySchema.parse(query);

  return {
    cursor: validated.cursor,
    limit: validated.limit,
    direction: validated.direction,
  };
};

/**
 * Build paginated result with metadata
 * @param data - Array of data items
 * @param params - Pagination parameters used for the query
 * @param totalCount - Optional total count for additional metadata
 * @returns Paginated result with metadata
 */
export const buildPaginatedResult = <T extends { id: string }>(
  data: T[],
  params: CursorPaginationParams,
  totalCount?: number
): PaginatedResult<T> => {
  const { limit, direction, cursor } = params;

  // Determine if there are more pages
  const hasNextPage = data.length === limit;
  const hasPreviousPage = Boolean(cursor);

  // Get cursors for navigation
  const nextCursor = hasNextPage ? data[data.length - 1]?.id : undefined;
  const previousCursor = hasPreviousPage ? data[0]?.id : undefined;

  // Calculate page numbers if total count is available
  let currentPage: number | undefined;
  let totalPages: number | undefined;

  if (totalCount !== undefined) {
    totalPages = Math.ceil(totalCount / limit);
    // Approximate current page (cursor-based pagination doesn't have exact page numbers)
    currentPage = cursor
      ? Math.ceil((totalCount - data.length) / limit) + 1
      : 1;
  }

  return {
    data,
    pagination: {
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      previousCursor,
      totalCount,
      limit,
      direction,
      currentPage,
      totalPages,
    },
  };
};

/**
 * Build SQL WHERE clause for cursor pagination
 * @param cursor - Cursor ID for pagination
 * @param direction - Direction of pagination
 * @param idColumn - Name of the ID column (default: 'id')
 * @returns SQL WHERE clause and parameters
 */
export const buildCursorWhereClause = (
  cursor: string | undefined,
  direction: "asc" | "desc",
  idColumn: string = "id"
): {
  whereClause: string;
  parameter?: string;
} => {
  if (!cursor) {
    return { whereClause: "" };
  }

  const operator = direction === "asc" ? ">" : "<";

  return {
    whereClause: `${idColumn} ${operator} ?`,
    parameter: cursor,
  };
};

/**
 * Extract pagination metadata from paginated result
 * @param result - Paginated result
 * @returns Pagination metadata only
 */
export const extractPaginationMeta = <T>(
  result: PaginatedResult<T>
): PaginationMeta => {
  return result.pagination;
};

/**
 * Create pagination links for API responses
 * @param baseUrl - Base URL for the API endpoint
 * @param pagination - Pagination metadata
 * @param additionalParams - Additional query parameters to include
 * @returns Pagination links
 */
export const createPaginationLinks = (
  baseUrl: string,
  pagination: PaginationMeta,
  additionalParams: Record<string, string> = {}
): {
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
} => {
  const { nextCursor, previousCursor, limit, direction } = pagination;

  const buildUrl = (cursor?: string, customDirection?: "asc" | "desc") => {
    const params = new URLSearchParams({
      ...additionalParams,
      limit: limit.toString(),
      direction: customDirection || direction,
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const links: Record<string, string | undefined> = {};

  // First page (no cursor, original direction)
  links.first = buildUrl();

  // Previous page
  if (previousCursor) {
    const prevDirection = direction === "asc" ? "desc" : "asc";
    links.previous = buildUrl(previousCursor, prevDirection);
  }

  // Next page
  if (nextCursor) {
    links.next = buildUrl(nextCursor, direction);
  }

  // Last page is complex with cursor pagination, so we omit it
  // links.last would require knowing the last record ID

  return Object.fromEntries(
    Object.entries(links).filter(([, value]) => value !== undefined)
  ) as { first?: string; previous?: string; next?: string; last?: string };
};

/**
 * Validate pagination parameters
 * @param params - Pagination parameters to validate
 * @returns Validation result
 */
export const validatePaginationParams = (
  params: Partial<CursorPaginationParams>
): {
  valid: boolean;
  error?: string;
  params?: CursorPaginationParams;
} => {
  try {
    const validated = createPaginationParams(params);
    return {
      valid: true,
      params: validated,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid pagination parameters",
    };
  }
};

/**
 * Calculate offset-based pagination from cursor (for COUNT queries)
 * Note: This is an approximation and should be used carefully
 * @param cursor - Current cursor
 * @param limit - Items per page
 * @param totalCount - Total items count
 * @returns Approximate offset and page number
 */
export const cursorToOffset = (
  cursor: string | undefined,
  limit: number,
  totalCount: number
): {
  offset: number;
  page: number;
} => {
  if (!cursor) {
    return { offset: 0, page: 1 };
  }

  // This is an approximation since cursor-based pagination doesn't map directly to offset
  // In practice, you might need to query the database to find the exact position
  const approximateOffset = Math.floor(totalCount * 0.1); // Very rough estimate
  const page = Math.floor(approximateOffset / limit) + 1;

  return { offset: approximateOffset, page };
};

/**
 * Create empty paginated result
 * @param params - Pagination parameters
 * @returns Empty paginated result
 */
export const createEmptyPaginatedResult = <T extends { id: string }>(
  params: CursorPaginationParams
): PaginatedResult<T> => {
  return buildPaginatedResult<T>([], params, 0);
};

/**
 * Transform offset-based pagination to cursor-based for backward compatibility
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @returns Cursor pagination parameters
 */
export const offsetToCursor = (
  page: number,
  limit: number
): Pick<CursorPaginationParams, "limit"> => {
  // Cursor-based pagination doesn't directly support page numbers
  // This is a simplified conversion for backward compatibility
  return {
    limit: Math.min(limit, PAGINATION_CONFIG.maxLimit),
  };
};
