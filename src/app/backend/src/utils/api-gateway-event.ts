import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Helper function to get HTTP method from API Gateway event
 */
export function getHttpMethod(event: APIGatewayProxyEvent): string {
  return event.httpMethod || 'GET';
}

/**
 * Helper function to get origin from headers in API Gateway event
 */
export function getOrigin(event: APIGatewayProxyEvent): string | undefined {
  if (!event.headers) return undefined;
  return event.headers.origin || event.headers.Origin;
}

/**
 * Helper function to get the request path from API Gateway event
 */
export function getPath(event: APIGatewayProxyEvent): string {
  return event.path || '';
}

/**
 * Helper function to get client IP from API Gateway event
 */
export function getClientIp(event: APIGatewayProxyEvent): string {
  return (
    event.requestContext?.identity?.sourceIp ||
    event.headers?.['X-Forwarded-For'] ||
    'unknown'
  );
}
