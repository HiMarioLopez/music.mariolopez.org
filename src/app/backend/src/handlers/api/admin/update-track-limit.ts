import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { updateParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'update-track-limit' });
const tracer = new Tracer({ serviceName: 'update-track-limit' });
const metrics = new Metrics({ namespace: 'update-track-limit' });

const MIN_TRACK_LIMIT = 5;
const MAX_TRACK_LIMIT = 30;

/**
 * Lambda handler for updating track limit parameter
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

  logger.info('Update Track Limit Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Get parameter name from environment
    const parameterName = process.env.PARAMETER_NAME;
    if (!parameterName) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

    // Validate request body
    if (!event.body) {
      logger.error('Missing request body');
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({
          message: 'Request body is required'
        })
      };
    }

    // Parse and validate track limit
    const body = JSON.parse(event.body);
    const trackLimit = body.trackLimit;

    if (typeof trackLimit !== 'number' ||
      trackLimit < MIN_TRACK_LIMIT ||
      trackLimit > MAX_TRACK_LIMIT) {
      logger.warn('Invalid track limit provided', { trackLimit });
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({
          message: `Invalid track limit. Must be a number between ${MIN_TRACK_LIMIT} and ${MAX_TRACK_LIMIT}.`
        })
      };
    }

    // Update the parameter in SSM
    await updateParameter(parameterName, trackLimit.toString());
    logger.info('Track limit updated successfully', { trackLimit });
    metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        message: 'Track limit updated successfully',
        trackLimit
      })
    };
  } catch (error) {
    logger.error('Error updating track limit', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        message: 'Error updating track limit',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
