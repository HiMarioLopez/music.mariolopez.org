import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getMUT } from '../../../services/mut';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'get-mut' });
const tracer = new Tracer({ serviceName: 'get-mut' });
const metrics = new Metrics({ namespace: 'get-mut' });

interface Environment {
  PARAMETER_NAME: string;
}

/**
 * Lambda handler for retrieving the Music User Token (MUT)
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

  logger.info('Event received', { event });

  try {
    const env: Environment = {
      PARAMETER_NAME: process.env.PARAMETER_NAME ?? ''
    };

    if (!env.PARAMETER_NAME) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

    const musicUserToken = await getMUT({ parameterName: env.PARAMETER_NAME });
    metrics.addMetric('MUTRetrievalSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ musicUserToken }),
    };
  } catch (error) {
    logger.error('Error retrieving MUT:', { error });
    metrics.addMetric('MUTRetrievalError', MetricUnit.Count, 1);

    if (error instanceof Error && error.message === 'MUT not found') {
      return {
        statusCode: 404,
        headers: getCorsHeaders(event.headers.origin, 'GET'),
        body: JSON.stringify({ message: 'MUT not found' }),
      };
    }

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        error: 'Error processing your request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
