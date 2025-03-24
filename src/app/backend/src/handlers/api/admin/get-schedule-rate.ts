import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'get-schedule-rate' });
const tracer = new Tracer({ serviceName: 'get-schedule-rate' });
const metrics = new Metrics({ namespace: 'get-schedule-rate' });

/**
 * Lambda handler for retrieving the schedule rate from Parameter Store
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

  logger.info('Get Schedule Rate Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Get parameter name from environment with fallback
    const parameterName = process.env.PARAMETER_NAME || '/music/schedule-rate';

    // Get schedule rate from Parameter Store
    const rate = await getParameter(parameterName);

    if (!rate) {
      logger.warn('Schedule rate parameter not found', { parameterName });
      metrics.addMetric('ParameterNotFound', MetricUnit.Count, 1);

      return {
        statusCode: 404,
        headers: getCorsHeaders(event.headers.origin, 'GET'),
        body: JSON.stringify({ error: 'Parameter not found' })
      };
    }

    logger.info('Successfully retrieved schedule rate', { rate });
    metrics.addMetric('RetrievalSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ rate })
    };
  } catch (error) {
    logger.error('Error retrieving schedule rate', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
