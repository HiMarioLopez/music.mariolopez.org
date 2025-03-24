import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { updateParameter } from '../../../services/parameter';
import { validateScheduleRate } from '../../../utils/schedule';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'update-schedule-rate' });
const tracer = new Tracer({ serviceName: 'update-schedule-rate' });
const metrics = new Metrics({ namespace: 'update-schedule-rate' });

/**
 * Lambda handler for updating the schedule rate in Parameter Store
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Update Schedule Rate Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Get parameter name from environment with fallback
    const parameterName = process.env.PARAMETER_NAME || '/music/schedule-rate';

    // Validate request body
    if (!event.body) {
      logger.warn('Missing request body');
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({ message: 'Missing request body' })
      };
    }

    // Parse and validate the rate
    const { rate } = JSON.parse(event.body);

    if (!rate || !validateScheduleRate(rate)) {
      logger.warn('Invalid schedule rate format', { rate });
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({
          message: "Invalid schedule rate format. Must be either 'rate(n units)' or a valid cron expression"
        })
      };
    }

    // Update the parameter in SSM
    await updateParameter(parameterName, rate);
    logger.info('Schedule rate updated successfully', { rate });
    metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        message: 'Schedule rate updated successfully',
        rate
      })
    };
  } catch (error) {
    logger.error('Error updating schedule rate', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
