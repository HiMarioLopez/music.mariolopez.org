import { APIGatewayProxyEvent } from 'aws-lambda';

// In-memory cache Map
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000;

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

const counters = new Map<string, { count: number; expiresAt: number }>();

/**
 * Increment a rate-limit counter in the warm-container's memory.
 *
 * This is per-instance rather than global (each concurrent Lambda has its own
 * memory), so limits are approximate under concurrency - acceptable here since
 * the previous Redis-backed limiter is decommissioned and this fails open.
 */
export const incrementCounter = async (key: string, ttl = 60): Promise<number> => {
  const now = Date.now();
  const existing = counters.get(key);

  if (!existing || existing.expiresAt <= now) {
    counters.set(key, { count: 1, expiresAt: now + ttl * 1000 });
    return 1;
  }

  existing.count += 1;
  return existing.count;
};
