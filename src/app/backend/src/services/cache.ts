import { APIGatewayProxyEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { createClient } from 'redis';

const logger = new Logger({ serviceName: 'cache-service' });

// In-memory cache Map
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Redis client setup
const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('No REDIS_URL environment variable found, Redis caching disabled');
    return null;
  }

  try {
    const client = createClient({
      url: redisUrl
    });
    
    client.on('error', (err) => {
      logger.error('Redis client error', { error: err });
    });
    
    return client;
  } catch (error) {
    logger.error('Failed to create Redis client', { error });
    return null;
  }
};

// Cache key creation helpers
export interface CacheKeyOptions {
  stripPrefix?: string;
  includeMethod?: boolean;
  includeQuery?: boolean;
}

/**
 * Create a unique cache key from an API Gateway event
 */
export const createCacheKey = (
  event: APIGatewayProxyEvent, 
  options: CacheKeyOptions = {}
): string => {
  let path = event.path;
  
  // Strip prefix if provided
  if (options.stripPrefix && path.startsWith(options.stripPrefix)) {
    path = path.substring(options.stripPrefix.length);
  }
  
  let key = path;
  
  // Add HTTP method if requested
  if (options.includeMethod) {
    key = `${event.httpMethod}:${key}`;
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
};

/**
 * Get data from in-memory cache
 */
export const getFromMemory = (key: string): { data: any; timestamp: number } | null => {
  const cached = memoryCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache entry has expired
  if (Date.now() - cached.timestamp > MEMORY_CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached;
};

/**
 * Set data in memory cache
 */
export const setInMemory = (key: string, data: any): void => {
  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Get data from Redis cache
 */
export const getFromRedis = async (key: string): Promise<any | null> => {
  const client = getRedisClient();
  if (!client) return null;
  
  try {
    await client.connect();
    const value = await client.get(key);
    await client.disconnect();
    
    if (value) {
      return JSON.parse(value);
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting data from Redis', { key, error });
    
    try {
      if (client.isOpen) {
        await client.disconnect();
      }
    } catch (disconnectError) {
      logger.error('Error disconnecting Redis client', { error: disconnectError });
    }
    
    return null;
  }
};

/**
 * Set data in Redis cache
 */
export const setInRedis = async (key: string, data: any, ttl = 300): Promise<void> => {
  const client = getRedisClient();
  if (!client) return;
  
  try {
    await client.connect();
    await client.set(key, JSON.stringify(data), { EX: ttl });
    await client.disconnect();
  } catch (error) {
    logger.error('Error setting data in Redis', { key, error });
    
    try {
      if (client.isOpen) {
        await client.disconnect();
      }
    } catch (disconnectError) {
      logger.error('Error disconnecting Redis client', { error: disconnectError });
    }
  }
};

/**
 * Increment a counter in Redis (used for rate limiting)
 */
export const incrementCounter = async (key: string, ttl = 60): Promise<number> => {
  const client = getRedisClient();
  if (!client) return 1; // If Redis is not available, allow the request
  
  try {
    await client.connect();
    
    // Increment the counter and set expiration if it's a new key
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, ttl);
    }
    
    await client.disconnect();
    return count;
  } catch (error) {
    logger.error('Error incrementing counter in Redis', { key, error });
    
    try {
      if (client.isOpen) {
        await client.disconnect();
      }
    } catch (disconnectError) {
      logger.error('Error disconnecting Redis client', { error: disconnectError });
    }
    
    return 1; // If there's an error, allow the request
  }
};
