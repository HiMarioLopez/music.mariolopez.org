import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for retrieving the schedule rate from Parameter Store
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>({ serviceName: 'get-schedule-rate' }, async (event, context, utils) => {
  const rateLimitResponse = await checkRateLimit(event, {
    ...RATE_LIMITS.ADMIN,
    logger: utils.logger,
    metrics: utils.metrics,
  });

  if (rateLimitResponse) {
    return rateLimitResponse as APIGatewayProxyResultV2;
  }

  // Get parameter name from environment with fallback
  const parameterName = utils.getRequiredEnvVar(
    'PARAMETER_NAME',
    '/music/schedule-rate'
  );

  // Get schedule rate from Parameter Store
  const rate = await getParameter(parameterName);

  if (!rate) {
    utils.logger.warn('Schedule rate parameter not found', { parameterName });
    utils.metrics.addMetric('ParameterNotFound', MetricUnit.Count, 1);

    return utils.createErrorResponse(
      event,
      new Error('Parameter not found'),
      HttpStatus.NOT_FOUND,
      'Schedule rate parameter not found'
    );
  }

  utils.logger.info('Successfully retrieved schedule rate', { rate });
  utils.metrics.addMetric('RetrievalSuccess', MetricUnit.Count, 1);

  return utils.createSuccessResponse(event, { rate });
});
