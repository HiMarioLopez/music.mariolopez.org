import { Redis } from '@upstash/redis';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { CACHE_TTL, REDIS_TOKEN, REDIS_URL } from '../config';
import { logger } from './powertools';

interface CacheOptions {
    stripPrefix?: string;
    includeMethod?: boolean;
    includeQuery?: boolean;
}

interface CacheData {
    data: any;
    timestamp: number;
}

// Memory cache
const memoryCache = new Map<string, CacheData>();

// Redis cache
const redisClient = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
});

export const createCacheKey = (
    event: APIGatewayProxyEvent,
    options: CacheOptions = {}
): string => {
    let path = event.path;

    // Strip prefix if needed
    if (options.stripPrefix && path.startsWith(options.stripPrefix)) {
        path = path.substring(options.stripPrefix.length);
    }

    // Remove double slashes and trailing slash
    path = path.replace(/\/+/g, '/').replace(/\/$/, '');

    let key = path;

    // Add method if needed
    if (options.includeMethod) {
        key = `${event.httpMethod}:${key}`;
    }

    // Add query parameters if needed
    if (options.includeQuery && event.queryStringParameters) {
        const queryParams = new URLSearchParams(event.queryStringParameters as Record<string, string>);
        const sortedParams = Array.from(queryParams.entries())
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        if (sortedParams) {
            key = `${key}?${sortedParams}`;
        }
    }

    return `musicbrainz:${key}`;
};

export const cacheService = {
    getFromMemory: (key: string): CacheData | null => {
        const cachedItem = memoryCache.get(key);

        if (!cachedItem) {
            return null;
        }

        const now = Date.now();
        if (now - cachedItem.timestamp > CACHE_TTL) {
            memoryCache.delete(key);
            return null;
        }

        return cachedItem;
    },

    setInMemory: (key: string, data: any): void => {
        memoryCache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    getFromRedis: async (key: string): Promise<any | null> => {
        try {
            const data = await redisClient.get(key);
            return data;
        } catch (error) {
            logger.warn('Error getting data from Redis', { error, key });
            return null;
        }
    },

    setInRedis: async (key: string, data: any, ttl: number = 24 * 60 * 60): Promise<void> => {
        try {
            await redisClient.set(key, data, { ex: ttl });
        } catch (error) {
            logger.warn('Error setting data in Redis', { error, key });
        }
    },

    // For rate limiting
    incrementCounter: async (key: string, expireInSeconds: number): Promise<number> => {
        try {
            const count = await redisClient.incr(key);
            if (count === 1) {
                await redisClient.expire(key, expireInSeconds);
            }
            return count;
        } catch (error) {
            logger.warn('Error incrementing counter in Redis', { error, key });
            return 0;
        }
    }
}; 