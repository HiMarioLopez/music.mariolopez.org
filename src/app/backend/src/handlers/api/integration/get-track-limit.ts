import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getCorsHeaders } from '../../../utils/cors';
import { getParameter } from '../../../services/parameter';

const logger = new Logger({ serviceName: 'get-track-limit' });
const tracer = new Tracer({ serviceName: 'get-track-limit' });
const metrics = new Metrics({ namespace: 'get-track-limit' });

/**
 * Lambda handler for retrieving the track limit from Parameter Store
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

  logger.info('Get Track Limit Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Get parameter name from environment
    const parameterName = process.env.PARAMETER_NAME;
    if (!parameterName) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

    // Get track limit from Parameter Store
    const trackLimitValue = await getParameter(parameterName);
    if (!trackLimitValue) {
      logger.error('Track limit parameter not found', { parameterName });
      metrics.addMetric('ParameterNotFound', MetricUnit.Count, 1);
      throw new Error('Track limit parameter not found');
    }

    // Parse the track limit value
    const trackLimit = parseInt(trackLimitValue, 10);
    logger.info('Successfully retrieved track limit', { trackLimit });
    metrics.addMetric('RetrievalSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ trackLimit })
    };
  } catch (error) {
    logger.error('Error retrieving track limit', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        message: 'Error retrieving track limit',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
