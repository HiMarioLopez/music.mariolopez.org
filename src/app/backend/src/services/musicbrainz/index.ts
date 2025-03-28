import axios from 'axios';
import { Logger } from '@aws-lambda-powertools/logger';
import { MusicBrainzEntity, SearchOptions, MusicBrainzResponse } from './types';

const logger = new Logger({ serviceName: 'musicbrainz-service' });

// MusicBrainz API Base URL
const MB_API_BASE_URL = 'https://musicbrainz.org/ws/2';

// User agent string (required by MusicBrainz)
const USER_AGENT =
  process.env.USER_AGENT || 'music.mariolopez.org/1.0 (mario@mariolopez.org)';

// Rate limiting delay - MusicBrainz allows 1 request per second
const RATE_LIMIT_DELAY = 1000; // 1 second in milliseconds

// Keep record of last request time to respect rate limiting
let lastRequestTime = 0;

/**
 * Ensure we're respecting MusicBrainz rate limiting by adding delays between requests
 */
const respectRateLimits = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delayNeeded = RATE_LIMIT_DELAY - timeSinceLastRequest;
    logger.debug(`Rate limiting: waiting ${delayNeeded}ms before next request`);
    await new Promise((resolve) => setTimeout(resolve, delayNeeded));
  }

  lastRequestTime = Date.now();
};

/**
 * Make a direct API call to MusicBrainz
 */
export const callApi = async (
  endpoint: string,
  params: Record<string, string> = {}
): Promise<MusicBrainzResponse> => {
  try {
    // Add format JSON to params
    const queryParams = {
      ...params,
      fmt: 'json',
    };

    // Respect rate limits
    await respectRateLimits();

    logger.info('Calling MusicBrainz API', { endpoint, queryParams });

    const response = await axios.get(`${MB_API_BASE_URL}/${endpoint}`, {
      params: queryParams,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    logger.info('MusicBrainz API call successful', {
      endpoint,
      status: response.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Error calling MusicBrainz API', {
      endpoint,
      params,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Preserve the original error
    if (error.response) {
      error.status = error.response.status;
    }

    throw error;
  }
};

/**
 * Search for entities in MusicBrainz
 */
export const search = async (
  entity: MusicBrainzEntity,
  options: SearchOptions | string
): Promise<MusicBrainzResponse> => {
  try {
    const params: Record<string, string> = {};

    if (typeof options === 'string') {
      // Simple query string
      params.query = options;
    } else {
      // Extract query, limit, offset
      params.query = options.query;

      if (options.limit !== undefined) {
        params.limit = options.limit.toString();
      }

      if (options.offset !== undefined) {
        params.offset = options.offset.toString();
      }

      // Add dismax if specified
      if (options.dismax !== undefined) {
        params.dismax = options.dismax.toString();
      }

      // Add any additional Lucene filters
      Object.entries(options).forEach(([key, value]) => {
        if (!['query', 'limit', 'offset', 'dismax'].includes(key)) {
          params[key] = String(value);
        }
      });
    }

    return await callApi(`${entity}`, params);
  } catch (error) {
    logger.error('Error searching MusicBrainz', {
      entity,
      options,
      error,
    });
    throw error;
  }
};

/**
 * Look up a specific entity by MBID
 */
export const lookup = async (
  entity: MusicBrainzEntity,
  mbid: string,
  includes: string[] = []
): Promise<MusicBrainzResponse> => {
  try {
    const params: Record<string, string> = {};

    // Add includes if specified
    if (includes.length > 0) {
      params.inc = includes.join('+');
    }

    return await callApi(`${entity}/${mbid}`, params);
  } catch (error) {
    logger.error('Error looking up MusicBrainz entity', {
      entity,
      mbid,
      includes,
      error,
    });
    throw error;
  }
};

/**
 * Browse related entities
 */
export const browse = async (
  entity: MusicBrainzEntity,
  params: Record<string, string>,
  limit?: number,
  offset?: number
): Promise<MusicBrainzResponse> => {
  try {
    const queryParams = { ...params };

    // Add limit and offset if specified
    if (limit !== undefined) {
      queryParams.limit = limit.toString();
    }

    if (offset !== undefined) {
      queryParams.offset = offset.toString();
    }

    return await callApi(`${entity}`, queryParams);
  } catch (error) {
    logger.error('Error browsing MusicBrainz entities', {
      entity,
      params,
      limit,
      offset,
      error,
    });
    throw error;
  }
};
