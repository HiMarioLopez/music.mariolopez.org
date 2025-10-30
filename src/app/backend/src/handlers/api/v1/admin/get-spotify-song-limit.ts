import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lambda handler for retrieving the Spotify history song limit from Parameter Store
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-spotify-song-limit' },
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

    // Get song limit from Parameter Store
    const songLimitValue = await getParameter(parameterName);

    if (!songLimitValue) {
      utils.logger.error('Spotify song limit parameter not found', { parameterName });
      utils.metrics.addMetric('ParameterNotFound', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        new Error('Spotify song limit parameter not found'),
        HttpStatus.NOT_FOUND,
        'Spotify song limit parameter not found'
      );
    }

    // Parse the song limit value
    const songLimit = parseInt(songLimitValue, 10);
    utils.logger.info('Successfully retrieved Spotify song limit', { songLimit });
    utils.metrics.addMetric('RetrievalSuccess', MetricUnit.Count, 1);

    return utils.createSuccessResponse(event, { songLimit });
  }
);

