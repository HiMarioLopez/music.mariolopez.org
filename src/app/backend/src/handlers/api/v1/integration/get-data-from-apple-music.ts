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
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lambda handler for fetching data from Apple Music API
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-data-from-apple-music' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.EXTERNAL_API,
      logger: utils.logger,
      metrics: utils.metrics,
    });
    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    try {
      // Check for required developer token in headers
      const developerToken =
        event.headers['Authorization']?.replace('Bearer ', '') ||
        event.headers['authorization']?.replace('Bearer ', '');
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

      // Use withCaching to check cache and fetch if needed
      const result = await withCaching(
        event,
        async () => {
          // Get the music user token
          const musicUserToken = await getMusicUserToken();
          // Clean query params
          const queryParams = event.queryStringParameters
            ? Object.fromEntries(
                Object.entries(event.queryStringParameters)
                  .filter(([_, v]) => v !== undefined)
                  .map(([k, v]) => [k, v as string])
              )
            : null;
          // Fetch from Apple Music API
          return await fetchFromApi(
            event.path,
            queryParams,
            developerToken,
            musicUserToken
          );
        },
        {
          stripPrefix: '/api',
          includeMethod: true,
          includeQuery: true,
          logger: utils.logger,
          metrics: utils.metrics,
        }
      );

      utils.metrics.addMetric('ApiFetchSuccess', MetricUnit.Count, 1);
      return utils.createSuccessResponse(
        event,
        { data: result.data, source: result.source },
        result.statusCode,
        result.headers
      );
    } catch (error: any) {
      utils.logger.error('Error processing Apple Music data request', {
        error,
      });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

      if (isTokenExpirationError(error)) {
        utils.logger.info(
          'Token expiration detected, triggering refresh notification'
        );
        await sendTokenRefreshNotification();
        utils.metrics.addMetric('TokenExpirationDetected', MetricUnit.Count, 1);
        return utils.createErrorResponse(
          event,
          error,
          HttpStatus.UNAUTHORIZED,
          'One or more authentication tokens have expired. An admin has been notified to refresh them.'
        );
      }

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message || 'An unexpected error occurred'
      );
    }
  }
);
