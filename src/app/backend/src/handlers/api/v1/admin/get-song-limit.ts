import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for retrieving the song limit from Parameter Store
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>({ serviceName: 'get-song-limit' }, async (event, context, utils) => {
  const rateLimitResponse = await checkRateLimit(event, {
    ...RATE_LIMITS.ADMIN,
    logger: utils.logger,
    metrics: utils.metrics,
  });

  if (rateLimitResponse) {
    return rateLimitResponse as APIGatewayProxyResultV2;
  }

  // Get parameter name from environment
  const parameterName = utils.getRequiredEnvVar('PARAMETER_NAME');

  // Get song limit from Parameter Store
  const songLimitValue = await getParameter(parameterName);

  if (!songLimitValue) {
    utils.logger.error('Song limit parameter not found', { parameterName });
    utils.metrics.addMetric('ParameterNotFound', MetricUnit.Count, 1);

    return utils.createErrorResponse(
      event,
      new Error('Song limit parameter not found'),
      HttpStatus.NOT_FOUND,
      'Song limit parameter not found'
    );
  }

  // Parse the song limit value
  const songLimit = parseInt(songLimitValue, 10);
  utils.logger.info('Successfully retrieved song limit', { songLimit });
  utils.metrics.addMetric('RetrievalSuccess', MetricUnit.Count, 1);

  return utils.createSuccessResponse(event, { songLimit });
});
