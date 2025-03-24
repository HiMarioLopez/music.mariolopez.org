import axios from 'axios';
import { Logger } from '@aws-lambda-powertools/logger';
import { getParameter } from '../parameter';

const logger = new Logger({ serviceName: 'apple-music-api-service' });
const APPLE_MUSIC_API_BASE_URL = 'https://api.music.apple.com/v1';

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
  queryParams: Record<string, string> | null,
  developerToken: string,
  musicUserToken: string
): Promise<any> => {
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
      params: queryParams || undefined
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
