import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import {
  fetchFromApi,
  getMusicUserToken,
  isTokenExpirationError,
} from '@services/apple-music/api';
import { sendTokenRefreshNotification } from '@services/notification';
import { withCaching } from '@utils/cache';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { getClientIp, HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for fetching data from Apple Music API
 * Implements caching and rate limiting
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>(
  { serviceName: 'apple-music-data-fetching' },
  async (event, context, utils) => {
    // Implement rate limiting
    const clientIp = getClientIp(event);
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.EXTERNAL_API,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResultV2;
    }

    // Check authorization
    const developerToken =
      event.headers?.['Authorization']?.replace('Bearer ', '') ||
      event.headers?.['authorization']?.replace('Bearer ', '');

    if (!developerToken) {
      utils.logger.warn('Missing developer token');
      utils.metrics.addMetric('AuthError', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        new Error('Developer token is required'),
        HttpStatus.UNAUTHORIZED,
        'Developer token is required'
      );
    }

    // Use our caching utility to handle memory/Redis caching
    try {
      const cachedResponse = await withCaching(
        event,
        async () => {
          // Get the music user token
          const musicUserToken = await getMusicUserToken();

          // Process query parameters
          const queryParams = event.queryStringParameters || {};

          // Fetch data from Apple Music API
          const apiData = await fetchFromApi(
            event.rawPath,
            queryParams,
            developerToken,
            musicUserToken
          );

          utils.metrics.addMetric('ApiFetchSuccess', MetricUnit.Count, 1);
          return apiData;
        },
        {
          stripPrefix: '/api',
          includeMethod: true,
          includeQuery: true,
          ttlSeconds: 60,
          logger: utils.logger,
          metrics: utils.metrics,
        }
      );

      return cachedResponse;
    } catch (error: any) {
      // We only need to handle token expiration specially, other errors can be handled by the wrapper
      if (isTokenExpirationError(error)) {
        utils.logger.info(
          'Token expiration detected, triggering refresh notification'
        );

        // Send notification to refresh token
        await sendTokenRefreshNotification();
        utils.metrics.addMetric('TokenExpirationDetected', MetricUnit.Count, 1);

        return utils.createErrorResponse(
          event,
          error,
          HttpStatus.UNAUTHORIZED,
          'One or more authentication tokens have expired. An admin has been notified to refresh them. Please try again in a few minutes.'
        );
      }

      // Re-throw for the wrapper to handle
      throw error;
    }
  }
);
