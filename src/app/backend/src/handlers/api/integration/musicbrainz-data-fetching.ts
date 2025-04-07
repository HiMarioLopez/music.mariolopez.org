import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import {
  createCacheKey,
  getFromMemory,
  getFromRedis,
  incrementCounter,
  setInMemory,
  setInRedis,
} from '../../../services/cache';
import { browse, callApi, lookup, search } from '../../../services/musicbrainz';
import {
  MusicBrainzEntityOptions,
  SearchOptions,
} from '../../../services/musicbrainz/types';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'musicbrainz-data-fetching' });
const tracer = new Tracer({ serviceName: 'musicbrainz-data-fetching' });
const metrics = new Metrics({ namespace: 'musicbrainz-data-fetching' });

// Rate limit threshold
const RATE_LIMIT_THRESHOLD = 30; // 30 requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds window

/**
 * Parse API Gateway path to MusicBrainz entity options
 */
const parsePath = (
  path: string,
  queryParams: Record<string, string> = {}
): MusicBrainzEntityOptions => {
  // Clean the path
  const cleanPath = path.replace(
    /^\/(?:api\/)?(?:nodejs\/)?(?:musicbrainz\/)?/,
    ''
  );
  const pathParts = cleanPath.split('/').filter(Boolean);

  if (pathParts.length === 0) {
    throw new Error('No entity specified');
  }

  const options: MusicBrainzEntityOptions = {
    entity: pathParts[0] as any,
  };

  if (pathParts.length >= 2) {
    // If it's a lookup request (entity/mbid)
    if (
      pathParts[1].match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      options.mbid = pathParts[1];

      // Handle includes
      if (queryParams.inc) {
        options.includes = queryParams.inc.split('+').filter(Boolean);
      }
    } else {
      // It's probably a sub-resource or other command
      options.params = { [pathParts[1]]: pathParts[2] || '' };
    }
  }

  // Handle search query
  if (queryParams.query) {
    options.query = queryParams.query;

    // Handle additional search parameters
    options.searchOptions = {
      query: queryParams.query,
    } as SearchOptions;

    // Add limit and offset
    if (queryParams.limit) {
      options.searchOptions.limit = parseInt(queryParams.limit, 10);
    }

    if (queryParams.offset) {
      options.searchOptions.offset = parseInt(queryParams.offset, 10);
    }

    // Add dismax parameter (convert string to boolean)
    if ('dismax' in queryParams) {
      options.searchOptions.dismax = queryParams.dismax === 'true';
    }

    // Add version parameter
    if (queryParams.version) {
      options.searchOptions.version = parseInt(queryParams.version, 10);
    }

    // Add any query filters that use Lucene syntax (field:value)
    // For example: type:group, country:US, etc.
    Object.entries(queryParams).forEach(([key, value]) => {
      if (
        ![
          'query',
          'limit',
          'offset',
          'dismax',
          'version',
          'fmt',
          'inc',
        ].includes(key)
      ) {
        if (options.searchOptions) {
          options.searchOptions[key] = value;
        }
      }
    });
  }

  // Handle pagination (for other request types)
  if (queryParams.limit && !options.searchOptions) {
    options.limit = parseInt(queryParams.limit, 10) || 25;
  }

  if (queryParams.offset && !options.searchOptions) {
    options.offset = parseInt(queryParams.offset, 10) || 0;
  }

  // Add all other query params (for browse requests)
  options.params = {
    ...options.params,
    ...Object.fromEntries(
      Object.entries(queryParams).filter(
        ([key]) =>
          ![
            'query',
            'limit',
            'offset',
            'inc',
            'fmt',
            'dismax',
            'version',
          ].includes(key)
      )
    ),
  };

  return options;
};

/**
 * Lambda handler for fetching data from MusicBrainz API
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

  logger.info('MusicBrainz Data Fetching Lambda invoked', { path: event.path });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Check if this is an OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(event.headers.origin, 'GET,OPTIONS'),
        body: '',
      };
    }

    // Implement rate limiting
    const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
    const rateLimitKey = `ratelimit:mb:${clientIp}`;

    // Check if this IP is making too many requests
    const requestCount = await incrementCounter(
      rateLimitKey,
      RATE_LIMIT_WINDOW
    );
    if (requestCount > RATE_LIMIT_THRESHOLD) {
      logger.warn('Rate limit exceeded', { clientIp, requestCount });
      metrics.addMetric('RateLimitExceeded', MetricUnit.Count, 1);

      return {
        statusCode: 429,
        headers: {
          ...getCorsHeaders(event.headers.origin, 'GET,OPTIONS'),
          'Retry-After': RATE_LIMIT_WINDOW.toString(),
        },
        body: JSON.stringify({
          error: 'Too Many Requests',
          message: 'Please try again later',
        }),
      };
    }

    // Create a cache key for this request
    const requestKey = createCacheKey(event, {
      stripPrefix: '/api',
      includeMethod: true,
      includeQuery: true,
    });

    // Check in-memory (L1) cache
    const cachedData = getFromMemory(requestKey);
    if (cachedData) {
      logger.info('In-memory cache hit');
      metrics.addMetric('L1CacheHit', MetricUnit.Count, 1);

      return {
        statusCode: 200,
        headers: {
          ...getCorsHeaders(event.headers.origin, 'GET,OPTIONS'),
          'Cache-Control': 'max-age=3600',
        },
        body: JSON.stringify({
          data: cachedData.data,
          source: 'memory-cache',
        }),
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
          ...getCorsHeaders(event.headers.origin, 'GET,OPTIONS'),
          'Cache-Control': 'max-age=3600',
        },
        body: JSON.stringify({
          data: redisData,
          source: 'redis-cache',
        }),
      };
    }

    // Cache miss - fetch from MusicBrainz API
    logger.info('Cache miss, fetching from MusicBrainz API');
    metrics.addMetric('CacheMiss', MetricUnit.Count, 1);

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};

    // Parse path to determine the MusicBrainz request
    const options = parsePath(
      event.path,
      queryParams as Record<string, string>
    );

    let response;

    if (options.query) {
      // Search request with enhanced options
      response = await search(
        options.entity,
        options.searchOptions || options.query
      );
      metrics.addMetric('SearchRequest', MetricUnit.Count, 1);
    } else if (options.mbid) {
      // Lookup request
      response = await lookup(
        options.entity,
        options.mbid,
        options.includes || []
      );
      metrics.addMetric('LookupRequest', MetricUnit.Count, 1);
    } else if (Object.keys(options.params || {}).length > 0) {
      // Browse request
      response = await browse(
        options.entity,
        options.params || {},
        options.limit,
        options.offset
      );
      metrics.addMetric('BrowseRequest', MetricUnit.Count, 1);
    } else {
      // Direct API call
      response = await callApi(options.entity, options.params || {});
      metrics.addMetric('DirectApiCall', MetricUnit.Count, 1);
    }

    // Store in both caches
    setInMemory(requestKey, response);
    await setInRedis(requestKey, response, 3600); // Cache for 1 hour

    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(event.headers.origin, 'GET,OPTIONS'),
        'Cache-Control': 'max-age=3600',
      },
      body: JSON.stringify({
        data: response,
        source: 'api',
      }),
    };
  } catch (error: any) {
    logger.error('Error processing MusicBrainz request', {
      error: error.message,
      status: error.status || error.response?.status,
      stack: error.stack,
    });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: error.status || error.response?.status || 500,
      headers: getCorsHeaders(event.headers.origin, 'GET,OPTIONS'),
      body: JSON.stringify({
        error: error.status ? 'MusicBrainz API Error' : 'Internal server error',
        message: error.message,
        code: error.status || error.response?.status,
      }),
    };
  }
};
