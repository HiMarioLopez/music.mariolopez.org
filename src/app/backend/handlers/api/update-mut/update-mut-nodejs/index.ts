import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from 'shared/nodejs/cors-headers';
import { logger, metrics, tracer, emitUpdateMetric } from './services/powertools';
import { storeMUT } from './services/mut';

interface Environment {
  PARAMETER_NAME: string;
}

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const { musicUserToken } = JSON.parse(event.body);

    if (!musicUserToken) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({ message: 'Missing musicUserToken in request body' }),
      };
    }

    const env: Environment = {
      PARAMETER_NAME: process.env.PARAMETER_NAME ?? ''
    };

    if (!env.PARAMETER_NAME) {
      throw new Error('Missing required environment variable: PARAMETER_NAME');
    }

    await storeMUT(musicUserToken, { parameterName: env.PARAMETER_NAME });
    await emitUpdateMetric();

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({ message: 'MUT stored successfully' }),
    };
  } catch (error) {
    logger.error('Error storing MUT:', { error });

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
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