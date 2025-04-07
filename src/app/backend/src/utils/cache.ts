import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { ApiGatewayEvent, getHttpMethod, getOrigin, getPath } from './types';
import {
  createCacheKey as originalCreateCacheKey,
  getFromMemory,
  getFromRedis,
  setInMemory,
  setInRedis,
} from '../services/cache';
import { getCorsHeaders } from './cors';

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
 * Creates a cache key for API Gateway V2 event
 */
function createCacheKeyV2(
  event: ApiGatewayEvent,
  options: {
    stripPrefix?: string;
    includeMethod?: boolean;
    includeQuery?: boolean;
  }
): string {
  // Convert V2 event format to match what createCacheKey expects
  const adaptedEvent = {
    path: getPath(event),
    httpMethod: getHttpMethod(event),
    queryStringParameters: event.queryStringParameters || {},
  };

  // Use original cache key function with adapted event
  return originalCreateCacheKey(adaptedEvent as any, options);
}

/**
 * Helper function for multi-level caching (memory + Redis) with handler wrapping
 */
export async function withCaching<T>(
  event: ApiGatewayEvent,
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

  // Create a cache key for this request using our V2 function
  const requestKey = createCacheKeyV2(event, {
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
