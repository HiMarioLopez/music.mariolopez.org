import axios, { AxiosRequestConfig } from 'axios';
import { APP_USER_AGENT, MAX_REQUESTS_PER_SECOND, MUSICBRAINZ_API_BASE_URL } from '../config';
import { logger } from './powertools';

// Rate limiting implementation
let lastRequestTime = 0;

const ensureRateLimit = async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minTimeBetweenRequests = 1000 / MAX_REQUESTS_PER_SECOND;

    if (timeSinceLastRequest < minTimeBetweenRequests) {
        const delay = minTimeBetweenRequests - timeSinceLastRequest;
        logger.debug(`Rate limiting: waiting ${delay}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    lastRequestTime = Date.now();
};

export interface SearchOptions {
    query: string;
    limit?: number;
    offset?: number;
    dismax?: boolean;
    version?: number;
    [key: string]: any; // Additional search parameters
}

export const musicBrainzService = {
    /**
     * Search for MusicBrainz entities.
     * 
     * @param entity The entity type to search (artist, recording, release, etc.)
     * @param options Search options including query and additional parameters
     * 
     * Supports Lucene query syntax:
     * - Field searches: "artist:Queen"
     * - Wildcards: "Nirvana*"
     * - Boolean operators: "Beatles AND "Hey Jude""
     * - Ranges: "date:[1980 TO 1989]"
     * - Grouping: "(beatles OR nirvana) AND live"
     */
    search: async (entity: string, options: SearchOptions | string): Promise<any> => {
        await ensureRateLimit();

        try {
            // Handle string query (backward compatibility)
            let searchOptions: SearchOptions;
            if (typeof options === 'string') {
                searchOptions = {
                    query: options
                };
                logger.debug('Using legacy string query parameter, consider switching to options object');
            } else {
                searchOptions = options;
            }

            const { query, limit = 10, offset = 0, dismax, version, ...additionalParams } = searchOptions;

            logger.info(`Searching ${entity} with query: ${query}`, {
                limit,
                offset,
                dismax: dismax ? 'true' : 'false'
            });

            const params: Record<string, string | number | boolean> = {
                query,
                limit,
                offset,
                fmt: 'json',
            };

            // Add optional parameters if they are defined
            if (dismax !== undefined) {
                params.dismax = dismax;
            }

            if (version !== undefined) {
                params.version = version;
            }

            // Add any additional parameters
            Object.entries(additionalParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    params[key] = value;
                }
            });

            const config: AxiosRequestConfig = {
                params,
                headers: {
                    'User-Agent': APP_USER_AGENT,
                    'Accept': 'application/json'
                }
            };

            const response = await axios.get(`${MUSICBRAINZ_API_BASE_URL}/${entity}`, config);
            return response.data;
        } catch (error: any) {
            logger.error('Error searching MusicBrainz', {
                error: error.message,
                entity,
                query: typeof options === 'string' ? options : options.query,
                status: error.response?.status
            });
            throw error;
        }
    },

    lookup: async (entity: string, mbid: string, includes: string[] = []): Promise<any> => {
        await ensureRateLimit();

        try {
            logger.info(`Looking up ${entity} with MBID: ${mbid}`);

            const config: AxiosRequestConfig = {
                params: {
                    fmt: 'json'
                },
                headers: {
                    'User-Agent': APP_USER_AGENT,
                    'Accept': 'application/json'
                }
            };

            if (includes.length > 0) {
                config.params.inc = includes.join('+');
            }

            const response = await axios.get(`${MUSICBRAINZ_API_BASE_URL}/${entity}/${mbid}`, config);
            return response.data;
        } catch (error: any) {
            logger.error('Error looking up MusicBrainz entity', {
                error: error.message,
                entity,
                mbid,
                status: error.response?.status
            });
            throw error;
        }
    },

    browse: async (entity: string, params: Record<string, string>, limit = 25, offset = 0): Promise<any> => {
        await ensureRateLimit();

        try {
            logger.info(`Browsing ${entity} with params: ${JSON.stringify(params)}`);

            const config: AxiosRequestConfig = {
                params: {
                    ...params,
                    limit,
                    offset,
                    fmt: 'json'
                },
                headers: {
                    'User-Agent': APP_USER_AGENT,
                    'Accept': 'application/json'
                }
            };

            const response = await axios.get(`${MUSICBRAINZ_API_BASE_URL}/${entity}`, config);
            return response.data;
        } catch (error: any) {
            logger.error('Error browsing MusicBrainz', {
                error: error.message,
                entity,
                params,
                status: error.response?.status
            });
            throw error;
        }
    },

    // Handle direct path calls (for more flexibility)
    callApi: async (path: string, params: Record<string, string> = {}): Promise<any> => {
        await ensureRateLimit();

        try {
            // Clean the path to ensure it doesn't start with a slash
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            logger.info(`Calling MusicBrainz API with path: ${cleanPath}`);

            const config: AxiosRequestConfig = {
                params: {
                    ...params,
                    fmt: 'json'
                },
                headers: {
                    'User-Agent': APP_USER_AGENT,
                    'Accept': 'application/json'
                }
            };

            const response = await axios.get(`${MUSICBRAINZ_API_BASE_URL}/${cleanPath}`, config);
            return response.data;
        } catch (error: any) {
            logger.error('Error calling MusicBrainz API', {
                error: error.message,
                path,
                status: error.response?.status
            });
            throw error;
        }
    }
}; 