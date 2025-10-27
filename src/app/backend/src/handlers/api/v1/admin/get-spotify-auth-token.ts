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
const SPOTIFY_SECRET_NAME = 'SpotifyClientSecret';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface StoredTokenData {
  access_token: string;
  token_type: string;
  expires_at: string; // ISO string
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
      const existingTokenData = await getParameter(parameterName);

      if (existingTokenData) {
        utils.logger.info('Existing token data found, validating token');
        try {
          const storedData: StoredTokenData = JSON.parse(existingTokenData);
          utils.logger.info('Parsed stored token data', {
            hasAccessToken: !!storedData.access_token,
            expiresAt: storedData.expires_at,
          });

          const now = new Date();
          const expiresAtDate = new Date(storedData.expires_at);

          if (now < expiresAtDate) {
            utils.logger.info('Using existing valid Spotify access token');
            utils.metrics.addMetric(
              'SpotifyTokenCacheHit',
              MetricUnit.Count,
              1
            );

            // Calculate remaining seconds until expiry
            const remainingSeconds = Math.floor(
              (expiresAtDate.getTime() - now.getTime()) / 1000
            );

            return utils.createSuccessResponse(event, {
              access_token: storedData.access_token,
              token_type: storedData.token_type,
              expires_in: remainingSeconds,
            });
          } else {
            utils.logger.info(
              'Stored Spotify token has expired, fetching new one'
            );
            utils.metrics.addMetric('SpotifyTokenExpired', MetricUnit.Count, 1);
          }
        } catch (error) {
          if (existingTokenData === 'placeholder') {
            utils.logger.info(
              'Token parameter has placeholder value, treating as no existing token'
            );
          } else {
            utils.logger.error('Failed to parse existing token data', {
              existingTokenData,
              error,
            });
            throw error;
          }
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

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + tokenData.expires_in * 1000
      ).toISOString();

      const storedData: StoredTokenData = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_at: expiresAt,
      };

      utils.logger.info('Calculated expiry timestamp', {
        currentTime: now.toISOString(),
        expiresAt,
        expiresIn: tokenData.expires_in,
      });

      await updateParameter(parameterName, JSON.stringify(storedData));
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
