import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getParameter, updateParameter } from '@services/parameter';
import { getSecret } from '@services/secret';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_SECRET_NAME = 'SpotifyClientSecret';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Test if a Spotify token is still valid by making a simple API call
 */
async function isTokenValid(token: string): Promise<boolean> {
  try {
    // Make a simple API call that doesn't require user authentication but tests the token
    await axios.get(`${SPOTIFY_API_BASE_URL}/markets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch a new Spotify access token using client credentials flow
 */
async function fetchNewSpotifyToken(
  clientId: string,
  clientSecret: string
): Promise<SpotifyTokenResponse> {
  const response = await axios.post<SpotifyTokenResponse>(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    }
  );

  return response.data;
}

/**
 * Lambda handler for getting and storing Spotify access token using client credentials flow
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-spotify-auth-token' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.ADMIN,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    // Get parameter name from environment
    const parameterName = utils.getRequiredEnvVar('PARAMETER_NAME');

    try {
      utils.logger.info('Starting Spotify token retrieval process', {
        parameterName,
      });

      // Check if we already have a valid token
      utils.logger.info(
        'Checking for existing Spotify token in parameter store'
      );
      let existingToken = await getParameter(parameterName);

      if (existingToken) {
        utils.logger.info('Existing token found, validating token');
        // Test if the existing token is still valid
        const tokenValid = await isTokenValid(existingToken);
        utils.logger.info('Token validation result', { isValid: tokenValid });

        if (tokenValid) {
          utils.logger.info('Using existing valid Spotify access token');
          utils.metrics.addMetric('SpotifyTokenCacheHit', MetricUnit.Count, 1);

          // Return the existing token with token response format
          return utils.createSuccessResponse(event, {
            access_token: existingToken,
            token_type: 'Bearer',
            expires_in: 3600, // Spotify tokens last 1 hour, but we don't track exact expiry
          });
        } else {
          utils.logger.info(
            'Existing Spotify token is invalid, fetching new one'
          );
          utils.metrics.addMetric('SpotifyTokenExpired', MetricUnit.Count, 1);
        }
      } else {
        utils.logger.info('No existing token found, fetching new one');
      }

      // No valid token exists, fetch a new one
      utils.logger.info('Fetching new Spotify access token');
      utils.metrics.addMetric(
        'SpotifyTokenRetrievalStart',
        MetricUnit.Count,
        1
      );

      // Get Spotify client credentials from AWS Secrets Manager
      utils.logger.info('Retrieving Spotify credentials from Secrets Manager', {
        secretName: SPOTIFY_SECRET_NAME,
      });
      const spotifyCredentials = await getSecret(SPOTIFY_SECRET_NAME);

      if (!spotifyCredentials) {
        utils.logger.error('Spotify credentials not found in Secrets Manager');
        throw new Error('Spotify client credentials not found');
      }
      utils.logger.info(
        'Successfully retrieved Spotify credentials from Secrets Manager'
      );

      // Parse the secret - assume it's JSON with client_id and client_secret
      let clientId: string;
      let clientSecret: string;

      try {
        utils.logger.info('Parsing Spotify credentials JSON');
        const parsed = JSON.parse(spotifyCredentials);
        clientId = parsed.client_id;
        clientSecret = parsed.client_secret;

        if (!clientId || !clientSecret) {
          utils.logger.error('Parsed credentials missing required fields', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
          });
          throw new Error('Invalid Spotify credentials format');
        }
        utils.logger.info('Successfully parsed Spotify credentials');
      } catch (error) {
        utils.logger.error('Failed to parse Spotify credentials as JSON', {
          error: error instanceof Error ? error.message : 'Unknown parse error',
        });
        throw new Error(
          'Spotify credentials must be JSON with client_id and client_secret fields'
        );
      }

      // Request access token from Spotify using client credentials flow
      utils.logger.info('Requesting new access token from Spotify API');
      const tokenData = await fetchNewSpotifyToken(clientId, clientSecret);
      utils.logger.info('Received response from Spotify token endpoint', {
        hasAccessToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
      });

      if (!tokenData.access_token) {
        utils.logger.error('No access token in Spotify API response');
        throw new Error('No access token received from Spotify');
      }

      // Store the token in SSM Parameter Store
      utils.logger.info('Storing new access token in Parameter Store', {
        parameterName,
      });
      await updateParameter(parameterName, tokenData.access_token);
      utils.logger.info('Spotify access token stored successfully');
      utils.metrics.addMetric(
        'SpotifyTokenRetrievalSuccess',
        MetricUnit.Count,
        1
      );

      return utils.createSuccessResponse(event, tokenData);
    } catch (error) {
      utils.logger.error('Error retrieving Spotify access token', { error });
      utils.metrics.addMetric(
        'SpotifyTokenRetrievalError',
        MetricUnit.Count,
        1
      );

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.error_description ||
          error.response?.data?.error ||
          'Failed to retrieve Spotify access token';

        return utils.createErrorResponse(event, error, status, message);
      }

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to retrieve Spotify access token'
      );
    }
  }
);
