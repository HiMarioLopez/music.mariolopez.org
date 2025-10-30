import { Logger } from '@aws-lambda-powertools/logger';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getSpotifyAccessToken, makeSpotifyApiRequest } from '@services/spotify';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

const logger = new Logger({ serviceName: 'get-spotify-status' });

/**
 * Lambda handler for checking Spotify OAuth status
 * GET /spotify/status
 * Returns authorization status by validating the access token with Spotify API
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-spotify-status' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.ADMIN,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    try {
      logger.info('Checking Spotify OAuth status');

      const accessTokenParameter = process.env.SPOTIFY_ACCESS_TOKEN_PARAMETER;
      if (!accessTokenParameter) {
        logger.warn(
          'Missing SPOTIFY_ACCESS_TOKEN_PARAMETER environment variable'
        );
        utils.metrics.addMetric('SpotifyStatusCheckError', MetricUnit.Count, 1);

        return utils.createSuccessResponse(event, {
          authorized: false,
          message: 'Spotify integration not configured',
        });
      }

      let authorized = false;
      let message = 'Spotify not authorized';

      try {
        // Get the access token from Parameter Store
        let accessToken: string;
        try {
          accessToken = await getSpotifyAccessToken();
        } catch (error) {
          logger.info('Spotify access token not found in Parameter Store', {
            error,
          });
          utils.metrics.addMetric('SpotifyNotAuthorized', MetricUnit.Count, 1);

          return utils.createSuccessResponse(event, {
            authorized: false,
            message: 'Spotify access token not found',
          });
        }

        // Validate the token by making a lightweight API call to get current user profile
        // This endpoint requires the token to be valid and will throw if expired/invalid
        try {
          await makeSpotifyApiRequest('/me', accessToken);
          // If the API call succeeds, the token is valid
          authorized = true;
          message = 'Spotify is authorized and token is valid';
          logger.info('Spotify token validation successful');
        } catch (apiError) {
          // Check if it's a token expiration/invalid error
          if (axios.isAxiosError(apiError)) {
            const status = apiError.response?.status;
            if (status === 401 || status === 403) {
              logger.warn('Spotify access token is invalid or expired', {
                status,
                error: apiError.response?.data,
              });
              message = 'Spotify token is invalid or expired';
            } else {
              logger.error('Spotify API validation request failed', {
                status,
                error: apiError.response?.data,
              });
              message = 'Failed to validate Spotify token';
            }
          } else {
            logger.error('Error validating Spotify token', { apiError });
            message = 'Failed to validate Spotify token';
          }
        }
      } catch (error) {
        logger.error('Error checking Spotify authorization', { error });
        message = 'Failed to check Spotify authorization status';
      }

      utils.metrics.addMetric('SpotifyStatusCheck', MetricUnit.Count, 1);

      if (authorized) {
        utils.metrics.addMetric('SpotifyAuthorized', MetricUnit.Count, 1);
      } else {
        utils.metrics.addMetric('SpotifyNotAuthorized', MetricUnit.Count, 1);
      }

      logger.info('Spotify status check completed', { authorized });

      return utils.createSuccessResponse(event, {
        authorized,
        message,
      });
    } catch (error) {
      logger.error('Failed to check Spotify status', { error });
      utils.metrics.addMetric('SpotifyStatusCheckError', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to check Spotify authorization status'
      );
    }
  }
);

