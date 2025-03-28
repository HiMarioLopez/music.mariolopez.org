import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getCorsHeaders } from '../../../utils/cors';
import { getParameter } from '../../../services/parameter';

const logger = new Logger({ serviceName: 'get-song-limit' });
const tracer = new Tracer({ serviceName: 'get-song-limit' });
const metrics = new Metrics({ namespace: 'get-song-limit' });

/**
 * Lambda handler for retrieving the song limit from Parameter Store
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

  logger.info('Get Song Limit Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Get parameter name from environment
    const parameterName = process.env.PARAMETER_NAME;
    if (!parameterName) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

    // Get song limit from Parameter Store
    const songLimitValue = await getParameter(parameterName);
    if (!songLimitValue) {
      logger.error('Song limit parameter not found', { parameterName });
      metrics.addMetric('ParameterNotFound', MetricUnit.Count, 1);
      throw new Error('Song limit parameter not found');
    }

    // Parse the song limit value
    const songLimit = parseInt(songLimitValue, 10);
    logger.info('Successfully retrieved song limit', { songLimit });
    metrics.addMetric('RetrievalSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ songLimit }),
    };
  } catch (error) {
    logger.error('Error retrieving song limit', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        message: 'Error retrieving song limit',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
