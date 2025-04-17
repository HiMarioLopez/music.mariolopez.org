import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { updateParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lambda handler for updating Music User Token in Parameter Store
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'set-mut' },
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

    // Validate request body
    if (!event.body) {
      utils.logger.warn('Missing request body');
      utils.metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return utils.createErrorResponse(
        event,
        new Error('Missing request body'),
        HttpStatus.BAD_REQUEST,
        'Missing request body'
      );
    }

    // Parse request body and validate musicUserToken
    const { musicUserToken } = JSON.parse(event.body);
    if (!musicUserToken) {
      utils.logger.warn('Missing musicUserToken in request body');
      utils.metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return utils.createErrorResponse(
        event,
        new Error('Missing musicUserToken in request body'),
        HttpStatus.BAD_REQUEST,
        'Missing musicUserToken in request body'
      );
    }

    // Store the token in Parameter Store as a secure string
    await updateParameter(parameterName, musicUserToken);
    utils.logger.info('MUT stored successfully');
    utils.metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

    return utils.createSuccessResponse(event, {
      message: 'MUT stored successfully',
    });
  }
);
