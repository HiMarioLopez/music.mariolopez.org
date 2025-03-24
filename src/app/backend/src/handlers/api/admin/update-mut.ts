import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { updateParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'update-mut' });
const tracer = new Tracer({ serviceName: 'update-mut' });
const metrics = new Metrics({ namespace: 'update-mut' });

/**
 * Lambda handler for updating Music User Token in Parameter Store
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

  logger.info('Update MUT Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

  try {
    // Get parameter name from environment
    const parameterName = process.env.PARAMETER_NAME;
    if (!parameterName) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

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

    // Parse request body and validate musicUserToken
    const { musicUserToken } = JSON.parse(event.body);
    if (!musicUserToken) {
      logger.warn('Missing musicUserToken in request body');
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({ message: 'Missing musicUserToken in request body' })
      };
    }

    // Store the token in Parameter Store as a secure string
    await updateParameter(parameterName, musicUserToken);
    logger.info('MUT stored successfully');
    metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({ message: 'MUT stored successfully' })
    };
  } catch (error) {
    logger.error('Error storing MUT', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        error: 'Error processing your request',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
