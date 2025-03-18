import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from 'shared/nodejs/cors-headers';
import { getMUT } from './services/mut';
import { emitRetrievalMetric, logger, metrics, tracer } from './services/powertools';

interface Environment {
  PARAMETER_NAME: string;
}

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const env: Environment = {
      PARAMETER_NAME: process.env.PARAMETER_NAME ?? ''
    };

    if (!env.PARAMETER_NAME) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

    const musicUserToken = await getMUT({ parameterName: env.PARAMETER_NAME });
    await emitRetrievalMetric();

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ musicUserToken }),
    };
  } catch (error) {
    logger.error('Error retrieving MUT:', { error });

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

export const handler = middy(baseHandler)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics)); 