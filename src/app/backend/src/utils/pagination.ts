import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoQueryResult, PaginatedResponse } from './types';

/**
 * Utility functions for handling pagination in API responses
 */

/**
 * Parses common pagination parameters from API Gateway V1 event
 */
export function parsePaginationParams(
  event: APIGatewayProxyEvent,
  defaultLimit = 50
): {
  limit: number;
  startKey?: string;
  queryParams: Record<string, string | undefined>;
} {
  // Get query parameters from API Gateway V1 event
  const queryParams = event.queryStringParameters || {};

  const limit = queryParams.limit
    ? parseInt(queryParams.limit as string, 10)
    : defaultLimit;

  const startKey = queryParams.startKey
    ? decodeURIComponent(queryParams.startKey as string)
    : undefined;

  return { limit, startKey, queryParams };
}

/**
 * Formats a query result into a standardized paginated response
 */
export function formatPaginatedResponse<T>(
  items: T[],
  lastEvaluatedKey?: string
): PaginatedResponse<T> {
  const response: PaginatedResponse<T> = {
    items,
    pagination: {
      count: items.length,
      hasMore: !!lastEvaluatedKey,
    },
  };

  if (lastEvaluatedKey) {
    response.pagination.nextToken = encodeURIComponent(lastEvaluatedKey);
  }

  return response;
}

/**
 * Formats a DynamoDB query result into a standardized paginated response
 */
export function formatDynamoQueryResult<T>(
  result: DynamoQueryResult<T>
): PaginatedResponse<T> {
  return formatPaginatedResponse(result.items, result.lastEvaluatedKey);
}

/**
 * Creates a cursor-based pagination object from an array of items
 */
export function createCursorPagination<T>(
  allItems: T[],
  pageSize: number,
  currentCursor?: string
): {
  items: T[];
  nextCursor?: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
} {
  // If no items, return empty pagination
  if (!allItems.length) {
    return {
      items: [],
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  // Parse the cursor if provided
  let startIndex = 0;
  let hasPreviousPage = false;

  if (currentCursor) {
    try {
      startIndex = parseInt(
        Buffer.from(currentCursor, 'base64').toString('ascii'),
        10
      );
      hasPreviousPage = startIndex > 0;
    } catch (e) {
      // Invalid cursor, start from beginning
      startIndex = 0;
    }
  }

  // Get items for current page
  const items = allItems.slice(startIndex, startIndex + pageSize);

  // Determine if there's a next page
  const hasNextPage = startIndex + pageSize < allItems.length;

  // Create next cursor if there are more items
  let nextCursor;
  if (hasNextPage) {
    const nextStartIndex = startIndex + pageSize;
    nextCursor = Buffer.from(nextStartIndex.toString(), 'ascii').toString(
      'base64'
    );
  }

  return {
    items,
    nextCursor,
    hasPreviousPage,
    hasNextPage,
  };
}
