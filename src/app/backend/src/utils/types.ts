import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Type definition for API Gateway V2 event
 */
export type ApiGatewayEvent = APIGatewayProxyEventV2;

/**
 * Type definition for API Gateway V2 result
 */
export type ApiGatewayResult = APIGatewayProxyResultV2;

/**
 * Helper function to get HTTP method from API Gateway V2 event
 */
export function getHttpMethod(event: ApiGatewayEvent): string {
  return event.requestContext?.http?.method || 'GET';
}

/**
 * Helper function to get origin from headers in API Gateway V2 event
 */
export function getOrigin(event: ApiGatewayEvent): string | undefined {
  if (!event.headers) return undefined;
  return event.headers.origin || event.headers.Origin;
}

/**
 * Helper function to get the request path from API Gateway V2 event
 */
export function getPath(event: ApiGatewayEvent): string {
  return event.rawPath || '';
}

/**
 * Helper function to get client IP from API Gateway V2 event
 */
export function getClientIp(event: ApiGatewayEvent): string {
  return event.requestContext?.http?.sourceIp || 'unknown';
}

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
