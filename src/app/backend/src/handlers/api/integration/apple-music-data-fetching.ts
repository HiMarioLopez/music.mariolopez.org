import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { fetchFromApi, getMusicUserToken, isTokenExpirationError } from '../../../services/apple-music/api';
import { createCacheKey, getFromMemory, getFromRedis, incrementCounter, setInMemory, setInRedis } from '../../../services/cache';
import { sendTokenRefreshNotification } from '../../../services/notification';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'apple-music-data-fetching' });
const tracer = new Tracer({ serviceName: 'apple-music-data-fetching' });
const metrics = new Metrics({ namespace: 'apple-music-data-fetching' });

// Rate limit threshold
const RATE_LIMIT_THRESHOLD = 50;
const RATE_LIMIT_WINDOW = 60; // 60 seconds

/**
 * Lambda handler for fetching data from Apple Music API
 * Implements caching and rate limiting
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Apple Music Data Fetching Lambda invoked', { path: event.path });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Implement rate limiting
    const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
    const rateLimitKey = `ratelimit:${clientIp}`;

    // Check if this IP is making too many requests
    const requestCount = await incrementCounter(rateLimitKey, RATE_LIMIT_WINDOW);
    if (requestCount > RATE_LIMIT_THRESHOLD) {
      logger.warn('Rate limit exceeded', { clientIp, requestCount });
      metrics.addMetric('RateLimitExceeded', MetricUnit.Count, 1);

      return {
        statusCode: 429,
        headers: {
          ...getCorsHeaders(event.headers.origin, 'GET'),
          'Retry-After': RATE_LIMIT_WINDOW.toString()
        },
        body: JSON.stringify({
          error: 'Too Many Requests',
          message: 'Please try again later'
        })
      };
    }

    // Create a cache key for this request
    const requestKey = createCacheKey(event, {
      stripPrefix: '/api',
      includeMethod: true,
      includeQuery: true
    });

    // Check authorization
    const developerToken = event.headers['Authorization']?.replace('Bearer ', '') ||
      event.headers['authorization']?.replace('Bearer ', '');

    if (!developerToken) {
      logger.warn('Missing developer token');
      metrics.addMetric('AuthError', MetricUnit.Count, 1);

      return {
        statusCode: 401,
        headers: getCorsHeaders(event.headers.origin, 'GET'),
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Developer token is required'
        })
      };
    }

    // Check in-memory (L1) cache
    const cachedData = getFromMemory(requestKey);
    if (cachedData) {
      logger.info('In-memory cache hit');
      metrics.addMetric('L1CacheHit', MetricUnit.Count, 1);

      return {
        statusCode: 200,
        headers: {
          ...getCorsHeaders(event.headers.origin, 'GET'),
          'Cache-Control': 'max-age=60',
        },
        body: JSON.stringify({
          data: cachedData.data,
          source: 'memory-cache'
        })
      };
    }

    // Check Redis (L2) cache
    const redisData = await getFromRedis(requestKey);
    if (redisData) {
      logger.info('Redis cache hit');
      metrics.addMetric('L2CacheHit', MetricUnit.Count, 1);

      // Update in-memory cache
      setInMemory(requestKey, redisData);

      return {
        statusCode: 200,
        headers: {
          ...getCorsHeaders(event.headers.origin, 'GET'),
          'Cache-Control': 'max-age=60',
        },
        body: JSON.stringify({
          data: redisData,
          source: 'redis-cache'
        })
      };
    }

    // Cache miss - fetch from Apple Music API
    logger.info('Cache miss, fetching from API');
    metrics.addMetric('CacheMiss', MetricUnit.Count, 1);

    // Get the music user token
    const musicUserToken = await getMusicUserToken();

    // Process query parameters
    const queryParams = event.queryStringParameters ?
      Object.fromEntries(
        Object.entries(event.queryStringParameters)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, v as string])
      ) : null;

    // Fetch data from Apple Music API
    const apiData = await fetchFromApi(
      event.path,
      queryParams,
      developerToken,
      musicUserToken
    );

    metrics.addMetric('ApiFetchSuccess', MetricUnit.Count, 1);

    // Store in both caches
    setInMemory(requestKey, apiData);
    await setInRedis(requestKey, apiData);

    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(event.headers.origin, 'GET'),
        'Cache-Control': 'max-age=60',
      },
      body: JSON.stringify({
        data: apiData,
        source: 'api'
      })
    };
  } catch (error: any) {
    logger.error('Error processing request', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    if (isTokenExpirationError(error)) {
      logger.info('Token expiration detected, triggering refresh notification');

      // Send notification to refresh token
      await sendTokenRefreshNotification();
      metrics.addMetric('TokenExpirationDetected', MetricUnit.Count, 1);

      return {
        statusCode: 401,
        headers: getCorsHeaders(event.headers.origin, 'GET'),
        body: JSON.stringify({
          error: 'One or more authentication tokens have expired. An admin has been notified to refresh them.',
          message: 'Please try again in a few minutes.'
        })
      };
    }

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      })
    };
  }
};
