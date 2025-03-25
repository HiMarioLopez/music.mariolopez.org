import { Logger } from '@aws-lambda-powertools/logger';
import axios from 'axios';
import { Track } from '../../models/track';
import { getParameter } from '../parameter';

const logger = new Logger({ serviceName: 'apple-music-api-service' });

const APPLE_MUSIC_API_BASE_URL = 'https://api.music.apple.com/v1';
const AUTH_ENDPOINT = 'https://music.mariolopez.org/api/nodejs/auth/token';

/**
 * Checks if an error is due to an expired token
 */
export const isTokenExpirationError = (error: any): boolean => {
  if (error.response && error.response.status === 401) {
    // Check for specific Apple Music token expiration indicators
    const errorData = error.response.data;
    return !!(
      errorData &&
      (errorData.errors?.some((e: any) => e.code === 'AUTH_TOKEN_EXPIRED' || e.title?.includes('Expired')) ||
        errorData.message?.includes('expired'))
    );
  }
  return false;
};

/**
 * Fetch developer token from auth endpoint
 * 
 * @returns Promise resolving to the developer token
 */
export const getDeveloperToken = async (): Promise<string> => {
    try {
        const response = await axios.get(AUTH_ENDPOINT, {
            timeout: 5000
        });

        if (!response.data?.token) {
            throw new Error('Invalid token response format');
        }

        logger.info('Successfully retrieved developer token');
        return response.data.token;
    } catch (error) {
        logger.error('Error fetching developer token', { error });
        if (axios.isAxiosError(error)) {
            logger.error('Axios error details', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }
        throw new Error('Failed to retrieve developer token');
    }
};

/**
 * Get the Music User Token from Parameter Store
 */
export const getMusicUserToken = async (): Promise<string> => {
  const tokenParameterName = process.env.MUSIC_USER_TOKEN_PARAMETER;
  if (!tokenParameterName) {
    throw new Error('Missing required environment variable: MUSIC_USER_TOKEN_PARAMETER');
  }

  const token = await getParameter(tokenParameterName);
  if (!token) {
    throw new Error('Music User Token not found in Parameter Store');
  }

  return token;
};

/**
 * Get both developer token and music user token
 * 
 * @returns Promise resolving to an object containing both tokens
 */
export const getTokens = async (): Promise<{ developerToken: string; musicUserToken: string }> => {
  const [developerToken, musicUserToken] = await Promise.all([
    getDeveloperToken(),
    getMusicUserToken()
  ]);
  
  return { developerToken, musicUserToken };
};

/**
 * Fetch data from the Apple Music API
 * 
 * @param path - API path (relative to the base URL)
 * @param queryParams - Optional query parameters
 * @param developerToken - Apple Music developer token
 * @param musicUserToken - Apple Music user token
 * @returns The API response data
 */
export const fetchFromApi = async (
  path: string,
  queryParams: Record<string, any> | null = null,
  developerToken?: string,
  musicUserToken?: string
): Promise<any> => {
  // Get tokens if not provided
  if (!developerToken || !musicUserToken) {
    const tokens = await getTokens();
    developerToken = developerToken || tokens.developerToken;
    musicUserToken = musicUserToken || tokens.musicUserToken;
  }

  // Clean up the path using regex to handle both API Gateway and custom domain patterns
  let cleanPath = path;
  
  // This regex will match and remove any of these patterns:
  // 1. /api/nodejs/apple-music/
  // 2. /api/v1/nodejs/apple-music/
  // 3. /prod/nodejs/apple-music/
  // 4. /nodejs/apple-music/
  // 5. /api/ at the beginning of the path
  const pathCleaningRegex = /^(?:\/api(?:\/v1)?|\/prod)?(?:\/nodejs\/apple-music)?/;
  
  // Apply the regex to clean the path
  cleanPath = cleanPath.replace(pathCleaningRegex, '');

  // Ensure path starts with a slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  const url = `${APPLE_MUSIC_API_BASE_URL}${cleanPath}`;

  logger.info('Processing Apple Music API request', {
    originalPath: path,
    cleanedPath: cleanPath,
    fullUrl: url
  });

  try {
    logger.info('Fetching data from Apple Music API', {
      url,
      hasQueryParams: !!queryParams,
      queryParamCount: queryParams ? Object.keys(queryParams).length : 0
    });

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${developerToken}`,
        'Music-User-Token': musicUserToken
      },
      params: queryParams || undefined,
      timeout: 10000
    });

    logger.info('Successfully fetched data from Apple Music API', {
      status: response.status,
      url
    });

    return response.data;
  } catch (error: any) {
    logger.error('Error fetching data from Apple Music API', {
      url,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Check if token expiration error to handle it appropriately
    if (isTokenExpirationError(error)) {
      logger.warn('Token expiration detected in API call');
      throw new Error('Apple Music token expired');
    }

    throw error;
  }
};

/**
 * Fetch recent tracks from Apple Music API
 * 
 * @param musicUserToken - Apple Music User Token (optional, will fetch if not provided)
 * @param trackLimitParameterName - Parameter name for track limit in SSM
 * @returns Promise resolving to an array of Track objects
 */
export const fetchRecentTracks = async (
    musicUserToken?: string,
    trackLimitParameterName?: string
): Promise<Track[]> => {
    try {
        // Get tokens if not provided
        if (!musicUserToken) {
            musicUserToken = await getMusicUserToken();
        }
        
        // Get developer token
        const developerToken = await getDeveloperToken();

        // Get track limit from SSM if parameter name provided
        let limit = 25; // Default limit
        if (trackLimitParameterName) {
            const trackLimit = await getParameter(trackLimitParameterName);
            if (trackLimit) {
                limit = parseInt(trackLimit, 10);
            } else {
                logger.warn('Track limit not found, using default value of 25');
            }
        }

        const apiPath = '/me/recent/played/tracks';
        logger.info('Fetching recent tracks', { limit });

        // Use the consolidated fetchFromApi function
        const responseData = await fetchFromApi(
            apiPath,
            { limit: limit.toString() },
            developerToken,
            musicUserToken
        );

        // Update validation to handle the actual response structure
        if (!responseData?.data || !Array.isArray(responseData.data)) {
            logger.error('Invalid response structure from Apple Music API', {
                response: JSON.stringify(responseData)
            });
            return [];
        }

        const tracks = responseData.data
            .map((track: any) => {
                try {
                    const { attributes, id } = track;

                    if (!id || !attributes) {
                        logger.warn('Track missing required properties', {
                            track: JSON.stringify(track)
                        });
                        return null;
                    }

                    return {
                        id,
                        artistName: attributes.artistName || 'Unknown Artist',
                        name: attributes.name || 'Unknown Track',
                        albumName: attributes.albumName || 'Unknown Album',
                        genreNames: attributes.genreNames,
                        trackNumber: attributes.trackNumber,
                        durationInMillis: attributes.durationInMillis,
                        releaseDate: attributes.releaseDate,
                        isrc: attributes.isrc,
                        artworkUrl: attributes.artwork?.url,
                        composerName: attributes.composerName,
                        url: attributes.url,
                        hasLyrics: attributes.hasLyrics,
                        isAppleDigitalMaster: attributes.isAppleDigitalMaster,
                        processedTimestamp: new Date().toISOString(),
                        artworkColors: attributes.artwork ? {
                            backgroundColor: `#${attributes.artwork.bgColor}`,
                            textColor1: `#${attributes.artwork.textColor1}`,
                            textColor2: `#${attributes.artwork.textColor2}`,
                            textColor3: `#${attributes.artwork.textColor3}`,
                            textColor4: `#${attributes.artwork.textColor4}`
                        } : undefined
                    };
                } catch (err) {
                    logger.warn('Error processing track', { error: err });
                    return null;
                }
            })
            .filter(Boolean) as Track[];

        logger.info('Successfully fetched tracks', { count: tracks.length });
        return tracks;
    } catch (error) {
        logger.error('Error fetching tracks from Apple Music API', { error });

        // Enhanced error logging for network errors
        if (axios.isAxiosError(error)) {
            logger.error('Axios error details', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
        }

        throw error;
    }
};
