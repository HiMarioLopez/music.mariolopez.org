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

export const createCacheKey = (
    event: APIGatewayProxyEvent,
    options: CacheKeyOptions = {}
): string => {
    const {
        stripPrefix = '/api/nodejs/apple-music',
        includeMethod = true,
        includeQuery = true
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
    getFromMemory: (key: string): CacheEntry | null => {
        const now = Date.now();
        if (CACHE[key] && CACHE[key].expiry > now) {
            return CACHE[key];
        }
        return null;
    },

    setInMemory: (key: string, data: any): void => {
        CACHE[key] = {
            data,
            expiry: Date.now() + CACHE_TTL
        };
    },

    getFromRedis: async (key: string): Promise<any | null> => {
        try {
            const data = await redis.get(key);
            return data || null;
        } catch (error) {
            logger.error('Redis get error', { error });
            return null;
        }
    },

    setInRedis: async (key: string, data: any): Promise<void> => {
        try {
            await redis.set(key, data, { ex: 3600 });
        } catch (error) {
            logger.error('Redis set error', { error });
        }
    }
}; 