import { Logger } from '@aws-lambda-powertools/logger';
import axios from 'axios';
import { AppleMusicSong, Song } from '../../models/song';
import { extractAppleMusicEndpoint } from '../../utils/path-utils';
import { getParameter } from '../parameter';

const logger = new Logger({ serviceName: 'apple-music-api-service' });

const APPLE_MUSIC_API_BASE_URL = 'https://api.music.apple.com/v1';
const AUTH_ENDPOINT = 'https://music.mariolopez.org/api/nodejs/v1/auth/token';

/**
 * Checks if an error is due to an expired token
 */
export const isTokenExpirationError = (error: any): boolean => {
  if (error.response && error.response.status === 401) {
    // Check for specific Apple Music token expiration indicators
    const errorData = error.response.data;
    return !!(
      errorData &&
      (errorData.errors?.some(
        (e: any) =>
          e.code === 'AUTH_TOKEN_EXPIRED' || e.title?.includes('Expired')
      ) ||
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
      timeout: 5000,
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
        message: error.message,
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
    throw new Error(
      'Missing required environment variable: MUSIC_USER_TOKEN_PARAMETER'
    );
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
export const getTokens = async (): Promise<{
  developerToken: string;
  musicUserToken: string;
}> => {
  const [developerToken, musicUserToken] = await Promise.all([
    getDeveloperToken(),
    getMusicUserToken(),
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

  // Extract the Apple Music endpoint path using our utility function
  const cleanPath = extractAppleMusicEndpoint(path);

  // If we somehow ended up with just a slash or empty path, that's an error condition
  if (cleanPath === '/' || !cleanPath) {
    logger.error('Path extraction failed - ended with empty or root path', {
      originalPath: path,
      cleanPath,
    });
    throw new Error(
      'Invalid path: Could not extract a valid Apple Music API endpoint'
    );
  }

  const url = `${APPLE_MUSIC_API_BASE_URL}${cleanPath}`;

  logger.info('Final Apple Music API request details', {
    originalPath: path,
    cleanedPath: cleanPath,
    fullUrl: url,
  });

  try {
    const startTime = Date.now();

    // Log detailed request configuration
    logger.info('Apple Music API request configuration', {
      method: 'GET',
      url,
      queryParams: queryParams || {},
      headers: {
        Authorization: developerToken
          ? `Bearer ${developerToken.substring(0, 5)}...`
          : 'Not provided',
        'Music-User-Token': musicUserToken
          ? `${musicUserToken.substring(0, 5)}...`
          : 'Not provided',
      },
    });

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        'Music-User-Token': musicUserToken,
      },
      params: queryParams || undefined,
      timeout: 10000,
    });

    const requestDuration = Date.now() - startTime;

    // Log response details with timing information
    logger.info('Apple Music API response received', {
      status: response.status,
      statusText: response.statusText,
      url,
      duration: `${requestDuration}ms`,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      responseHeaders: {
        ...response.headers,
        Authorization: undefined,
        'Music-User-Token': undefined,
      },
      // Include a summary of the response data without logging everything
      dataStructure: {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataType: response.data ? typeof response.data : 'none',
        isArray: Array.isArray(response.data),
        itemCount: Array.isArray(response.data)
          ? response.data.length
          : response.data &&
              typeof response.data === 'object' &&
              response.data.data
            ? Array.isArray(response.data.data)
              ? response.data.data.length
              : 'not array'
            : 'no data property',
      },
    });

    // For debugging, optionally log more details about specific data structures
    // This can be enabled/disabled as needed
    if (process.env.DEBUG_APPLE_MUSIC === 'true') {
      logger.debug('Apple Music API detailed response data', {
        data:
          JSON.stringify(response.data).substring(0, 2000) +
          (JSON.stringify(response.data).length > 2000 ? '...[truncated]' : ''),
      });
    }

    return response.data;
  } catch (error: any) {
    logger.error('Error fetching data from Apple Music API', {
      url,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      // Additional error information
      code: error.code,
      isAxiosError: axios.isAxiosError(error),
      requestConfig: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            timeout: error.config.timeout,
            params: error.config.params,
          }
        : 'No request config available',
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
 * Fetch recent songs from Apple Music API
 *
 * @param musicUserToken - Apple Music User Token (optional, will fetch if not provided)
 * @param songLimitParameterName - Parameter name for song limit in SSM
 * @returns Promise resolving to an array of Song objects
 */
export const fetchRecentSongs = async (
  musicUserToken?: string,
  songLimitParameterName?: string
): Promise<Song[]> => {
  try {
    // Get tokens if not provided
    if (!musicUserToken) {
      musicUserToken = await getMusicUserToken();
    }

    // Get developer token
    const developerToken = await getDeveloperToken();

    // Get song limit from SSM if parameter name provided
    let limit = 25; // Default limit
    if (songLimitParameterName) {
      const songLimit = await getParameter(songLimitParameterName);
      if (songLimit) {
        limit = parseInt(songLimit, 10);
      } else {
        logger.warn('Song limit not found, using default value of 25');
      }
    }

    // REF: https://developer.apple.com/documentation/applemusicapi/get-v1-me-recent-played-tracks
    const apiPath = '/me/recent/played/tracks';
    logger.info('Fetching recent songs', {
      types: 'songs',
      limit,
    });

    // Use the consolidated fetchFromApi function
    const responseData = await fetchFromApi(
      apiPath,
      {
        types: 'songs', // Only fetch songs
        limit: limit.toString(),
      },
      developerToken,
      musicUserToken
    );

    // Update validation to handle the actual response structure
    if (!responseData?.data || !Array.isArray(responseData.data)) {
      logger.error('Invalid response structure from Apple Music API', {
        response: JSON.stringify(responseData),
      });
      return [];
    }

    const songs = responseData.data
      .map((song: any) => {
        try {
          const { attributes, id } = song;

          if (!id || !attributes) {
            logger.warn('Song missing required properties', {
              song: JSON.stringify(song),
            });
            return null;
          }

          const appleSong: AppleMusicSong = {
            id,
            artistName: attributes.artistName || 'Unknown Artist',
            name: attributes.name || 'Unknown Track',
            albumName: attributes.albumName || 'Unknown Album',
            source: 'apple',
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
            artworkColors: attributes.artwork
              ? {
                  backgroundColor: `#${attributes.artwork.bgColor}`,
                  textColor1: `#${attributes.artwork.textColor1}`,
                  textColor2: `#${attributes.artwork.textColor2}`,
                  textColor3: `#${attributes.artwork.textColor3}`,
                  textColor4: `#${attributes.artwork.textColor4}`,
                }
              : undefined,
          };

          return appleSong;
        } catch (err) {
          logger.warn('Error processing song', { error: err });
          return null;
        }
      })
      .filter(Boolean) as Song[];

    logger.info('Successfully fetched songs', { count: songs.length });
    return songs;
  } catch (error) {
    logger.error('Error fetching songs from Apple Music API', { error });

    // Enhanced error logging for network errors
    if (axios.isAxiosError(error)) {
      logger.error('Axios error details', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      });
    }

    throw error;
  }
};
