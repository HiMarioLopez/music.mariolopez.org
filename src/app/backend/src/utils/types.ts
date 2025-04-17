/**
 * Pagination information in responses
 */
export interface PaginationInfo {
  count: number;
  hasMore: boolean;
  nextToken?: string;
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * DynamoDB query result with pagination
 */
export interface DynamoQueryResult<T> {
  items: T[];
  lastEvaluatedKey?: string;
}

/**
 * Common HTTP status codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  message: string;
  error?: string;
}
