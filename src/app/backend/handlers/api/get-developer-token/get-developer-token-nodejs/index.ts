import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from 'shared/nodejs/cors-headers';
import { emitTokenMetric, logger, metrics, tracer } from './services/powertools';
import { generateDeveloperToken } from './services/token';

interface Environment {
  APPLE_AUTH_KEY_SECRET_NAME: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
}

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const env: Environment = {
      APPLE_AUTH_KEY_SECRET_NAME: process.env.APPLE_AUTH_KEY_SECRET_NAME ?? '',
      APPLE_TEAM_ID: process.env.APPLE_TEAM_ID ?? '',
      APPLE_KEY_ID: process.env.APPLE_KEY_ID ?? ''
    };

    // Validate environment variables
    const missingVars = Object.entries(env)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const token = await generateDeveloperToken(env);
    await emitTokenMetric();

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ token })
    };

  } catch (error) {
    logger.error('Error generating developer token', { error });

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        error: 'Error processing your request',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export const handler = middy(baseHandler)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));