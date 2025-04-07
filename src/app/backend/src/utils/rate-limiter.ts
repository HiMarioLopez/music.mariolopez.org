import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { incrementCounter } from '../services/cache';
import { getCorsHeaders } from './cors';
import {
  ApiGatewayEvent,
  getHttpMethod,
  getOrigin,
  getClientIp,
} from './types';

interface RateLimiterOptions {
  threshold: number;
  windowSeconds: number;
  logger: Logger;
  metrics: Metrics;
}

/**
 * Default rate limit options
 */
const defaultOptions: RateLimiterOptions = {
  threshold: 50,
  windowSeconds: 60,
  logger: new Logger({ serviceName: 'rate-limiter' }),
  metrics: new Metrics({ namespace: 'rate-limiter' }),
};

/**
 * Checks if a request exceeds rate limits
 * Returns null if the request is within limits, or an error response if limits are exceeded
 */
export async function checkRateLimit(
  event: ApiGatewayEvent,
  options: Partial<RateLimiterOptions> = {}
) {
  const config = { ...defaultOptions, ...options };
  const { threshold, windowSeconds, logger, metrics } = config;

  // Extract client IP from event - using V2 API Gateway event format
  const clientIp = getClientIp(event);
  const rateLimitKey = `ratelimit:${clientIp}`;

  // Check if this IP is making too many requests
  const requestCount = await incrementCounter(rateLimitKey, windowSeconds);

  if (requestCount > threshold) {
    logger.warn('Rate limit exceeded', { clientIp, requestCount });
    metrics.addMetric('RateLimitExceeded', MetricUnit.Count, 1);

    const origin = getOrigin(event);
    const method = getHttpMethod(event);

    return {
      statusCode: 429,
      headers: {
        ...getCorsHeaders(origin, `${method},OPTIONS`),
        'Retry-After': windowSeconds.toString(),
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Please try again later',
      }),
    };
  }

  return null;
}
