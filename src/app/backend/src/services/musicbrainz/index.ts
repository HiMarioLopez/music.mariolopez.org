import axios from 'axios';
import { Logger } from '@aws-lambda-powertools/logger';
import {
  MusicBrainzEntity,
  SearchOptions,
  MusicBrainzResponse,
  MusicBrainzEntityOptions,
} from './types';

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
 * Parse API Gateway path to MusicBrainz entity options
 */
export const parsePath = (
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

/**
 * Process a MusicBrainz API request based on entity options
 * Determines which API method to call based on the options
 */
export const processMusicBrainzRequest = async (
  options: MusicBrainzEntityOptions
): Promise<MusicBrainzResponse> => {
  logger.debug('Processing MusicBrainz request', { options });

  let response;

  if (options.query) {
    // Search request with enhanced options
    logger.info('Performing MusicBrainz search', {
      entity: options.entity,
      query: options.query,
    });

    response = await search(
      options.entity,
      options.searchOptions || options.query
    );
  } else if (options.mbid) {
    // Lookup request
    logger.info('Performing MusicBrainz lookup', {
      entity: options.entity,
      mbid: options.mbid,
    });

    response = await lookup(
      options.entity,
      options.mbid,
      options.includes || []
    );
  } else if (Object.keys(options.params || {}).length > 0) {
    // Browse request
    logger.info('Performing MusicBrainz browse', {
      entity: options.entity,
      params: options.params,
    });

    response = await browse(
      options.entity,
      options.params || {},
      options.limit,
      options.offset
    );
  } else {
    // Direct API call
    logger.info('Performing direct MusicBrainz API call', {
      entity: options.entity,
    });

    response = await callApi(options.entity, options.params || {});
  }

  return response;
};
