import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getMUT } from '@services/mut';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for retrieving the Music User Token (MUT)
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>({ serviceName: 'get-mut' }, async (event, context, utils) => {
  const rateLimitResponse = await checkRateLimit(event, {
    ...RATE_LIMITS.ADMIN,
    logger: utils.logger,
    metrics: utils.metrics,
  });

  if (rateLimitResponse) {
    return rateLimitResponse as APIGatewayProxyResultV2;
  }

  // Get and validate required environment variables
  const parameterName = utils.getRequiredEnvVar('PARAMETER_NAME');

  try {
    const musicUserToken = await getMUT({ parameterName });
    utils.metrics.addMetric('MUTRetrievalSuccess', MetricUnit.Count, 1);

    return utils.createSuccessResponse(event, { musicUserToken });
  } catch (error) {
    // Keep only the error-specific handling logic
    if (error instanceof Error && error.message === 'MUT not found') {
      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.NOT_FOUND,
        'MUT not found'
      );
    }

    // Re-throw for other errors to be handled by the wrapper
    throw error;
  }
});
