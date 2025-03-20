import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { cacheService, createCacheKey } from './services/cache';
import { musicBrainzService, SearchOptions } from './services/musicbrainz';
import { emitCacheMetric, logger, metrics, tracer } from './services/powertools';
import { MusicBrainzEntityOptions } from './types';

// Helper to parse path into MusicBrainz entity options
const parsePath = (path: string, queryParams: Record<string, string> = {}): MusicBrainzEntityOptions => {
    // Clean the path
    const cleanPath = path.replace(/^\/(?:api\/)?(?:nodejs\/)?(?:musicbrainz\/)?/, '');
    const pathParts = cleanPath.split('/').filter(Boolean);

    if (pathParts.length === 0) {
        throw new Error('No entity specified');
    }

    const options: MusicBrainzEntityOptions = {
        entity: pathParts[0]
    };

    if (pathParts.length >= 2) {
        // If it's a lookup request (entity/mbid)
        if (pathParts[1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
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
            query: queryParams.query
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
            if (!['query', 'limit', 'offset', 'dismax', 'version', 'fmt', 'inc'].includes(key)) {
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
            Object.entries(queryParams).filter(([key]) =>
                !['query', 'limit', 'offset', 'inc', 'fmt', 'dismax', 'version'].includes(key))
        )
    };

    return options;
};

// Get CORS headers function
const getCorsHeaders = (origin?: string, method?: string) => {
    const allowedOrigins = [
        'https://music.mariolopez.org',
        'https://www.music.mariolopez.org',
        'http://localhost:3000'
    ];

    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
    } else {
        headers['Access-Control-Allow-Origin'] = '*';
    }

    return headers;
};

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Check if this is an OPTIONS request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(event.headers.origin, 'GET'),
                body: ''
            };
        }

        // Rate limiting
        const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
        const rateLimitKey = `ratelimit:mb:${clientIp}`;
        const requestCount = await cacheService.incrementCounter(rateLimitKey, 60);

        if (requestCount > 30) { // 30 requests per minute per IP
            logger.warn('Rate limit exceeded', { clientIp, requestCount });
            return {
                statusCode: 429,
                headers: {
                    ...getCorsHeaders(event.headers.origin, 'GET'),
                    'Retry-After': '60'
                },
                body: JSON.stringify({ error: 'Too Many Requests', message: 'Please try again later' })
            };
        }

        // Create cache key
        const requestKey = createCacheKey(event, {
            stripPrefix: '/api/nodejs',
            includeMethod: true,
            includeQuery: true
        });

        // Check memory cache first
        const cachedData = cacheService.getFromMemory(requestKey);
        if (cachedData) {
            logger.info('Cache hit: memory');
            await emitCacheMetric('cache');
            return {
                statusCode: 200,
                headers: {
                    ...getCorsHeaders(event.headers.origin, 'GET'),
                    'Cache-Control': 'max-age=3600',
                },
                body: JSON.stringify({ data: cachedData.data, source: 'memory-cache' })
            };
        }

        // Check Redis cache
        const redisData = await cacheService.getFromRedis(requestKey);
        if (redisData) {
            logger.info('Cache hit: Redis');
            await emitCacheMetric('cache');

            // Store in memory cache for future requests
            cacheService.setInMemory(requestKey, redisData);

            return {
                statusCode: 200,
                headers: {
                    ...getCorsHeaders(event.headers.origin, 'GET'),
                    'Cache-Control': 'max-age=3600',
                },
                body: JSON.stringify({ data: redisData, source: 'redis-cache' })
            };
        }

        // Cache miss - fetch from API
        await emitCacheMetric('api');
        logger.info('Cache miss, fetching from MusicBrainz API');

        // Parse query parameters
        const queryParams = event.queryStringParameters || {};

        // Parse path to determine the MusicBrainz request
        const options = parsePath(event.path, queryParams as Record<string, string>);
        let response;

        if (options.query) {
            // Search request with enhanced options
            response = await musicBrainzService.search(
                options.entity,
                options.searchOptions || options.query
            );
        } else if (options.mbid) {
            // Lookup request
            response = await musicBrainzService.lookup(
                options.entity,
                options.mbid,
                options.includes || []
            );
        } else if (Object.keys(options.params || {}).length > 0) {
            // Browse request
            response = await musicBrainzService.browse(
                options.entity,
                options.params || {},
                options.limit,
                options.offset
            );
        } else {
            // Direct API call
            response = await musicBrainzService.callApi(
                options.entity,
                options.params || {}
            );
        }

        // Cache the response
        cacheService.setInMemory(requestKey, response);
        await cacheService.setInRedis(requestKey, response);

        return {
            statusCode: 200,
            headers: {
                ...getCorsHeaders(event.headers.origin, 'GET'),
                'Cache-Control': 'max-age=60',
            },
            body: JSON.stringify({ data: response, source: 'api' })
        };
    } catch (error: any) {
        logger.error('Error processing request', { error: error.message, stack: error.stack });

        return {
            statusCode: error.response?.status || 500,
            headers: getCorsHeaders(event.headers.origin, 'GET'),
            body: JSON.stringify({
                error: error.response?.status ? 'MusicBrainz API Error' : 'Internal server error',
                message: error.message,
                code: error.response?.status
            })
        };
    }
};

export const handler = middy(baseHandler)
    .use(captureLambdaHandler(tracer))
    .use(logMetrics(metrics)); 