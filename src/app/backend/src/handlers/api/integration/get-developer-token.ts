import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { generateDeveloperToken } from '../../../services/developer-token';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'get-developer-token' });
const tracer = new Tracer({ serviceName: 'get-developer-token' });
const metrics = new Metrics({ namespace: 'get-developer-token' });

interface Environment {
  APPLE_AUTH_KEY_SECRET_NAME: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
}

/**
 * Lambda handler for generating Apple Music developer tokens
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

  logger.info('Developer Token Lambda invoked', { event });
  metrics.addMetric('RequestCount', MetricUnit.Count, 1);

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
    metrics.addMetric('TokenGenerationSuccess', MetricUnit.Count, 1);

    logger.info('Successfully generated developer token');

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ token })
    };
  } catch (error) {
    logger.error('Error generating developer token', { error });
    metrics.addMetric('TokenGenerationError', MetricUnit.Count, 1);

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
