import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getSpotifyAccessToken } from '@services/spotify';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lambda handler for retrieving the Spotify access token
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-spotify-token' },
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
      const accessToken = await getSpotifyAccessToken();
      utils.metrics.addMetric('SpotifyTokenRetrievalSuccess', MetricUnit.Count, 1);

      return utils.createSuccessResponse(event, { accessToken });
    } catch (error) {
      // Keep only the error-specific handling logic
      if (error instanceof Error && error.message.includes('not found')) {
        return utils.createErrorResponse(
          event,
          error,
          HttpStatus.NOT_FOUND,
          'Spotify access token not found'
        );
      }

      // Re-throw for other errors to be handled by the wrapper
      throw error;
    }
  }
);

