import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { updateParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { validateScheduleRate } from '@utils/schedule';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lambda handler for updating the schedule rate in Parameter Store
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'set-schedule-rate' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.ADMIN,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    // Get parameter name from environment with fallback
    const parameterName = utils.getRequiredEnvVar(
      'PARAMETER_NAME',
      '/music/schedule-rate'
    );

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

    // Parse and validate the rate
    const { rate } = JSON.parse(event.body);

    if (!rate || !validateScheduleRate(rate)) {
      utils.logger.warn('Invalid schedule rate format', { rate });
      utils.metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return utils.createErrorResponse(
        event,
        new Error('Invalid schedule rate format'),
        HttpStatus.BAD_REQUEST,
        "Invalid schedule rate format. Must be either 'rate(n units)' or a valid cron expression"
      );
    }

    // Update the parameter in SSM
    await updateParameter(parameterName, rate);
    utils.logger.info('Schedule rate updated successfully', { rate });
    utils.metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

    return utils.createSuccessResponse(event, {
      message: 'Schedule rate updated successfully',
      rate,
    });
  }
);
