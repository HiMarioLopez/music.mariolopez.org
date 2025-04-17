import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import {
  getFromMemory,
  getFromRedis,
  setInMemory,
  setInRedis,
} from '../services/cache';
import { getCorsHeaders } from './cors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getHttpMethod, getOrigin, getPath } from './api-gateway-event';

interface CacheOptions {
  stripPrefix?: string;
  includeMethod?: boolean;
  includeQuery?: boolean;
  ttlSeconds?: number;
  logger?: Logger;
  metrics?: Metrics;
}

/**
 * Default cache options
 */
const defaultOptions: CacheOptions = {
  stripPrefix: '/api',
  includeMethod: true,
  includeQuery: true,
  ttlSeconds: 60, // Default TTL of 60 seconds
  logger: new Logger({ serviceName: 'cache-helper' }),
  metrics: new Metrics({ namespace: 'cache-helper' }),
};

/**
 * Creates a cache key for API Gateway V1 event
 */
function createCacheKey(
  event: APIGatewayProxyEvent,
  options: {
    stripPrefix?: string;
    includeMethod?: boolean;
    includeQuery?: boolean;
  }
): string {
  let path = getPath(event);

  // Strip prefix if provided
  if (options.stripPrefix && path.startsWith(options.stripPrefix)) {
    path = path.substring(options.stripPrefix.length);
  }

  let key = path;

  // Add HTTP method if requested
  if (options.includeMethod) {
    key = `${getHttpMethod(event)}:${key}`;
  }

  // Add query parameters if requested
  if (options.includeQuery && event.queryStringParameters) {
    const queryString = Object.entries(event.queryStringParameters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    if (queryString) {
      key = `${key}?${queryString}`;
    }
  }

  return key;
}

/**
 * Helper function for multi-level caching (memory + Redis) with handler wrapping
 */
export async function withCaching<T>(
  event: APIGatewayProxyEvent,
  fetchData: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{
  data: T;
  source: 'memory-cache' | 'redis-cache' | 'api';
  statusCode: number;
  headers: Record<string, string>;
}> {
  const config = { ...defaultOptions, ...options };
  const {
    stripPrefix,
    includeMethod,
    includeQuery,
    ttlSeconds,
    logger,
    metrics,
  } = config;

  // Create a cache key for this request
  const requestKey = createCacheKey(event, {
    stripPrefix,
    includeMethod,
    includeQuery,
  });

  // Check in-memory (L1) cache
  const cachedData = getFromMemory(requestKey);
  if (cachedData) {
    logger?.info('In-memory cache hit');
    metrics?.addMetric('L1CacheHit', MetricUnit.Count, 1);

    const origin = getOrigin(event);
    const method = getHttpMethod(event);

    return {
      data: cachedData.data as T,
      source: 'memory-cache',
      statusCode: 200,
      headers: {
        ...getCorsHeaders(origin, method),
        'Cache-Control': `max-age=${ttlSeconds}`,
      },
    };
  }

  // Check Redis (L2) cache
  const redisData = await getFromRedis(requestKey);
  if (redisData) {
    logger?.info('Redis cache hit');
    metrics?.addMetric('L2CacheHit', MetricUnit.Count, 1);

    // Update in-memory cache
    setInMemory(requestKey, redisData);

    const origin = getOrigin(event);
    const method = getHttpMethod(event);

    return {
      data: redisData as T,
      source: 'redis-cache',
      statusCode: 200,
      headers: {
        ...getCorsHeaders(origin, method),
        'Cache-Control': `max-age=${ttlSeconds}`,
      },
    };
  }

  // Cache miss - fetch fresh data
  logger?.info('Cache miss, fetching fresh data');
  metrics?.addMetric('CacheMiss', MetricUnit.Count, 1);

  try {
    const data = await fetchData();

    // Store in both caches
    setInMemory(requestKey, data);
    await setInRedis(requestKey, data, ttlSeconds);

    const origin = getOrigin(event);
    const method = getHttpMethod(event);

    return {
      data,
      source: 'api',
      statusCode: 200,
      headers: {
        ...getCorsHeaders(origin, method),
        'Cache-Control': `max-age=${ttlSeconds}`,
      },
    };
  } catch (error) {
    logger?.error('Error fetching data', { error });
    metrics?.addMetric('CacheDataFetchError', MetricUnit.Count, 1);
    throw error;
  }
}
