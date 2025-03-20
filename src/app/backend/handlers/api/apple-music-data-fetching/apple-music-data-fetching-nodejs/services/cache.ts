import { Redis } from '@upstash/redis';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { REDIS_URL, REDIS_TOKEN, CACHE_TTL } from '../config';
import { CacheEntry, CacheKeyOptions } from '../types';
import { logger } from './powertools';

// In-memory cache (L1)
const CACHE: Record<string, CacheEntry> = {};

// Redis client initialization
const redis = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
});

/**
 * Create a cache key based on the API event and options
 * @param event - The API event
 * @param options - The cache key options
 * @returns The cache key
 */
export const createCacheKey = (
    event: APIGatewayProxyEvent,
    options: CacheKeyOptions = {}
): string => {
    const {
        stripPrefix = '/api/nodejs/apple-music', // Strip the default prefix for Apple Music API
        includeMethod = true, // Include the HTTP method in the cache key
        includeQuery = true // Include the query string in the cache key
    } = options;

    const { path, queryStringParameters, httpMethod } = event;
    const normalizedPath = path
        .replace(new RegExp(`^${stripPrefix}`), '')
        .replace(/^\/+|\/+$/g, '');

    const parts = [];
    if (includeMethod) parts.push(httpMethod);
    parts.push(normalizedPath);

    if (includeQuery && queryStringParameters) {
        const sortedParams = Object.keys(queryStringParameters)
            .sort()
            .reduce((acc: Record<string, string>, key) => {
                acc[key] = queryStringParameters[key] || '';
                return acc;
            }, {});
        parts.push(JSON.stringify(sortedParams));
    }

    return parts.join(':');
};

export const cacheService = {
    /**
     * Get data from in-memory cache
     * @param key - The cache key
     * @returns The cached data or null if it doesn't exist or has expired
     */
    getFromMemory: (key: string): CacheEntry | null => {
        const now = Date.now();
        if (CACHE[key] && CACHE[key].expiry > now) {
            return CACHE[key];
        }
        return null;
    },

    /**
     * Set data in in-memory cache
     * @param key - The cache key
     * @param data - The data to cache
     */
    setInMemory: (key: string, data: any): void => {
        CACHE[key] = {
            data,
            expiry: Date.now() + CACHE_TTL
        };
    },

    /**
     * Get data from Redis cache
     * @param key - The cache key
     * @returns The cached data or null if it doesn't exist or has expired
     */
    getFromRedis: async (key: string): Promise<any | null> => {
        try {
            const data = await redis.get(key);
            return data || null;
        } catch (error) {
            logger.error('Redis get error', { error });
            return null;
        }
    },

    /**
     * Set data in Redis cache
     * @param key - The cache key
     * @param data - The data to cache
     */
    setInRedis: async (key: string, data: any): Promise<void> => {
        try {
            await redis.set(key, data, { ex: 60 });
        } catch (error) {
            logger.error('Redis set error', { error });
        }
    },

    /**
     * Increment a counter in Redis
     * @param key - The cache key
     * @param expirySeconds - The expiry time in seconds
     * @returns The incremented count
     */
    incrementCounter: async (key: string, expirySeconds: number): Promise<number> => {
        try {
            const count = await redis.incr(key);
            // Set expiry only on first increment
            if (count === 1) {
                await redis.expire(key, expirySeconds);
            }
            return count;
        } catch (error) {
            logger.error('Redis increment error', { error });
            return 0;
        }
    }
}; 