import { Logger } from '@aws-lambda-powertools/logger';
import axios from 'axios';
import { Song, SpotifySong } from '../../models/song';
import { getParameter } from '../parameter';
import { getSecretJson } from '../secret';

const logger = new Logger({ serviceName: 'spotify-api-service' });

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE_URL = 'https://accounts.spotify.com';

/**
 * Spotify API configuration
 */
export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Spotify access token response
 */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Spotify refresh token response
 */
export interface SpotifyRefreshTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
}

/**
 * Spotify track object from API
 */
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    external_urls: {
      spotify: string;
    };
  };
  duration_ms: number;
  popularity?: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  external_ids?: {
    isrc?: string;
  };
  disc_number?: number;
  track_number?: number;
  is_local?: boolean;
  explicit?: boolean;
}

/**
 * Spotify recently played response
 */
export interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: SpotifyTrack;
    played_at: string;
    context?: {
      type: string;
      external_urls: {
        spotify: string;
      };
    };
  }>;
  next?: string;
  cursors?: {
    after?: string;
    before?: string;
  };
  limit: number;
  href: string;
}

/**
 * Get Spotify configuration from Secrets Manager and environment variables
 *
 * Retrieves client_id and client_secret from AWS Secrets Manager.
 * Redirect URI is retrieved from environment variable as it's not stored in the secret.
 */
export const getSpotifyConfig = async (): Promise<SpotifyConfig> => {
  const secretName = process.env.SPOTIFY_CLIENT_SECRET_NAME;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!secretName) {
    throw new Error(
      'Missing required environment variable: SPOTIFY_CLIENT_SECRET_NAME'
    );
  }

  if (!redirectUri) {
    throw new Error(
      'Missing required environment variable: SPOTIFY_REDIRECT_URI'
    );
  }

  try {
    // Retrieve credentials from Secrets Manager
    const secret = await getSecretJson<{
      client_id: string;
      client_secret: string;
    }>(secretName);

    if (!secret.client_id || !secret.client_secret) {
      throw new Error(
        'Spotify secret is missing required fields: client_id, client_secret'
      );
    }

    logger.info(
      'Successfully retrieved Spotify configuration from Secrets Manager'
    );

    return {
      clientId: secret.client_id,
      clientSecret: secret.client_secret,
      redirectUri,
    };
  } catch (error) {
    logger.error(
      'Failed to retrieve Spotify configuration from Secrets Manager',
      { error }
    );
    throw new Error(
      `Failed to retrieve Spotify configuration from Secrets Manager: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Get Spotify access token from Parameter Store
 */
export const getSpotifyAccessToken = async (): Promise<string> => {
  const tokenParameterName = process.env.SPOTIFY_ACCESS_TOKEN_PARAMETER;
  if (!tokenParameterName) {
    throw new Error(
      'Missing required environment variable: SPOTIFY_ACCESS_TOKEN_PARAMETER'
    );
  }

  const token = await getParameter(tokenParameterName);
  if (!token) {
    throw new Error('Spotify access token not found in Parameter Store');
  }

  return token;
};

/**
 * Get Spotify refresh token from Parameter Store
 */
export const getSpotifyRefreshToken = async (): Promise<string> => {
  const tokenParameterName = process.env.SPOTIFY_REFRESH_TOKEN_PARAMETER;
  if (!tokenParameterName) {
    throw new Error(
      'Missing required environment variable: SPOTIFY_REFRESH_TOKEN_PARAMETER'
    );
  }

  const token = await getParameter(tokenParameterName);
  if (!token) {
    throw new Error('Spotify refresh token not found in Parameter Store');
  }

  return token;
};

/**
 * Store Spotify tokens in Parameter Store
 */
export const storeSpotifyTokens = async (
  accessToken: string,
  refreshToken?: string
): Promise<void> => {
  const accessTokenParameterName = process.env.SPOTIFY_ACCESS_TOKEN_PARAMETER;
  const refreshTokenParameterName = process.env.SPOTIFY_REFRESH_TOKEN_PARAMETER;

  if (!accessTokenParameterName) {
    throw new Error(
      'Missing required environment variable: SPOTIFY_ACCESS_TOKEN_PARAMETER'
    );
  }

  logger.info('Storing Spotify tokens', {
    accessTokenParameterName,
    hasRefreshToken: !!refreshToken,
    refreshTokenParameterName,
  });

  // Get the parameter service (assuming it's imported)
  const { updateParameter } = await import('../parameter');

  // Store access token
  await updateParameter(accessTokenParameterName, accessToken);
  logger.info('Successfully stored Spotify access token');

  // Store refresh token if provided
  if (refreshToken && refreshTokenParameterName) {
    await updateParameter(refreshTokenParameterName, refreshToken);
    logger.info('Successfully stored Spotify refresh token');
  }
};

/**
 * Refresh Spotify access token
 */
export const refreshSpotifyAccessToken =
  async (): Promise<SpotifyRefreshTokenResponse> => {
    const config = await getSpotifyConfig();
    const refreshToken = await getSpotifyRefreshToken();

    try {
      const response = await axios.post(
        `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      const tokenData: SpotifyRefreshTokenResponse = response.data;

      // Store the new access token
      await storeSpotifyTokens(tokenData.access_token);

      logger.info('Successfully refreshed Spotify access token');
      return tokenData;
    } catch (error) {
      logger.error('Error refreshing Spotify access token', { error });
      if (axios.isAxiosError(error)) {
        logger.error('Spotify refresh token error details', {
          status: error.response?.status,
          data: error.response?.data,
        });

        // Check if the refresh token has been revoked
        if (isRefreshTokenRevokedError(error)) {
          logger.error('Spotify refresh token has been revoked', {
            status: error.response?.status,
            errorData: error.response?.data,
          });

          // Send notification to admins that re-authentication is required
          try {
            const { sendTokenRefreshNotification } = await import(
              '../notification'
            );
            await sendTokenRefreshNotification(
              'Spotify refresh token has been revoked. Re-authentication is required to restore access to Spotify API.',
              'Spotify Refresh Token Revoked - Re-authentication Required'
            );
            logger.info(
              'Sent notification about revoked Spotify refresh token'
            );
          } catch (notificationError) {
            logger.error(
              'Failed to send notification about revoked refresh token',
              {
                notificationError,
              }
            );
            // Don't throw - we still want to throw the revoked token error
          }

          // Throw a specific error indicating re-authentication is needed
          throw new Error(
            'Spotify refresh token has been revoked. Re-authentication is required.'
          );
        }
      }
      throw new Error('Failed to refresh Spotify access token');
    }
  };

/**
 * Check if an error is due to a revoked refresh token
 * This occurs when the refresh token has been invalidated (user revoked access, token expired, etc.)
 */
export const isRefreshTokenRevokedError = (error: any): boolean => {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const errorData = error.response.data;
    return !!(
      errorData &&
      errorData.error === 'invalid_grant' &&
      (errorData.error_description?.includes('revoked') ||
        errorData.error_description?.includes('Refresh token revoked'))
    );
  }
  return false;
};

/**
 * Check if an error is due to token expiration
 */
export const isTokenExpirationError = (error: any): boolean => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    const errorData = error.response.data;
    return !!(
      errorData &&
      (errorData.error?.message?.includes('expired') ||
        errorData.error?.message?.includes('revoked'))
    );
  }
  return false;
};

/**
 * Make authenticated request to Spotify API
 */
export const makeSpotifyApiRequest = async (
  endpoint: string,
  accessToken?: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    data?: any;
  } = {}
): Promise<any> => {
  // Get access token if not provided
  if (!accessToken) {
    try {
      accessToken = await getSpotifyAccessToken();
    } catch (error) {
      logger.warn(
        'Failed to get access token from parameter store, attempting refresh',
        { error }
      );
      try {
        const tokenData = await refreshSpotifyAccessToken();
        accessToken = tokenData.access_token;
      } catch (refreshError) {
        logger.error('Failed to refresh Spotify access token', {
          refreshError,
        });
        throw new Error('Spotify authentication failed');
      }
    }
  }

  const url = `${SPOTIFY_API_BASE_URL}${endpoint}`;

  try {
    const response = await axios({
      method: options.method || 'GET',
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: options.params,
      data: options.data,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    if (isTokenExpirationError(error)) {
      logger.warn('Spotify token expired, attempting refresh');
      try {
        const tokenData = await refreshSpotifyAccessToken();
        const newAccessToken = tokenData.access_token;

        // Retry the request with new token
        const response = await axios({
          method: options.method || 'GET',
          url,
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json',
          },
          params: options.params,
          data: options.data,
          timeout: 10000,
        });

        return response.data;
      } catch (refreshError) {
        logger.error('Failed to refresh token and retry request', {
          refreshError,
        });
        throw new Error('Spotify token refresh failed');
      }
    }

    logger.error('Spotify API request failed', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
    });

    throw error;
  }
};

/**
 * Fetch recently played tracks from Spotify
 */
export const fetchRecentlyPlayedTracks = async (
  limit: number = 25,
  accessToken?: string
): Promise<Song[]> => {
  try {
    logger.info('Fetching recently played tracks from Spotify', { limit });

    const response = await makeSpotifyApiRequest(
      '/me/player/recently-played',
      accessToken,
      {
        params: {
          limit: Math.min(limit, 50), // Spotify max is 50
        },
      }
    );

    const data: SpotifyRecentlyPlayedResponse = response;

    if (!data.items || !Array.isArray(data.items)) {
      logger.error('Invalid response structure from Spotify API', {
        response: JSON.stringify(data),
      });
      return [];
    }

    const songs = data.items
      .map((item) => {
        try {
          const track = item.track;

          if (!track || !track.id) {
            logger.warn('Track missing required properties', {
              track: JSON.stringify(track),
            });
            return null;
          }

          const spotifySong: SpotifySong = {
            id: track.id,
            name: track.name,
            artistName: track.artists[0]?.name || 'Unknown Artist',
            albumName: track.album?.name || 'Unknown Album',
            source: 'spotify',
            spotifyId: track.id,
            spotifyUrl: track.external_urls?.spotify || '',
            durationMs: track.duration_ms,
            popularity: track.popularity,
            previewUrl: track.preview_url,
            externalUrls: track.external_urls,
            albumId: track.album?.id,
            artistId: track.artists[0]?.id,
            discNumber: track.disc_number,
            trackNumber: track.track_number,
            isLocal: track.is_local,
            isExplicit: track.explicit,
            artworkUrl: track.album?.images?.[0]?.url,
            url: track.external_urls?.spotify,
            processedTimestamp: new Date(item.played_at).toISOString(),
          };

          return spotifySong;
        } catch (err) {
          logger.warn('Error processing Spotify track', { error: err });
          return null;
        }
      })
      .filter(Boolean) as Song[];

    logger.info('Successfully fetched Spotify tracks', {
      count: songs.length,
      requestedLimit: limit,
    });

    return songs;
  } catch (error) {
    logger.error('Error fetching recently played tracks from Spotify', {
      error,
    });

    if (axios.isAxiosError(error)) {
      logger.error('Spotify API error details', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }

    throw error;
  }
};

/**
 * Generate Spotify authorization URL for OAuth flow with optional PKCE
 */
export const generateSpotifyAuthUrl = async (
  state?: string,
  codeChallenge?: string,
  codeVerifier?: string
): Promise<string> => {
  const config = await getSpotifyConfig();

  // Note: Code verifier should be stored BEFORE generating the URL
  // This function now only generates the URL, storage should happen in the handler

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri, // Must match exactly what's registered
    scope: 'user-read-recently-played user-read-currently-playing',
    show_dialog: 'false',
  });

  if (state) {
    params.append('state', state);
  }

  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  return `${SPOTIFY_ACCOUNTS_BASE_URL}/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token with PKCE support
 */
export const exchangeCodeForToken = async (
  code: string,
  codeVerifier?: string
): Promise<SpotifyTokenResponse> => {
  const config = await getSpotifyConfig();

  try {
    const bodyParams: Record<string, string> = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    };

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add PKCE parameters if code verifier is provided
    if (codeVerifier) {
      bodyParams.code_verifier = codeVerifier;
      // For PKCE with confidential client (server-side), use Basic auth
      // Encode client_id:client_secret as base64 for Authorization header
      const credentials = Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      // Fallback to client credentials in body for non-PKCE flow
      bodyParams.client_id = config.clientId;
      bodyParams.client_secret = config.clientSecret;
    }

    const response = await axios.post(
      `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
      new URLSearchParams(bodyParams),
      {
        headers,
        timeout: 10000,
      }
    );

    const tokenData: SpotifyTokenResponse = response.data;

    // Store tokens
    await storeSpotifyTokens(tokenData.access_token, tokenData.refresh_token);

    logger.info('Successfully exchanged code for Spotify tokens', {
      pkceUsed: !!codeVerifier,
    });
    return tokenData;
  } catch (error) {
    logger.error('Error exchanging code for Spotify token', { error });
    if (axios.isAxiosError(error)) {
      logger.error('Spotify token exchange error details', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw new Error('Failed to exchange authorization code for Spotify token');
  }
};
