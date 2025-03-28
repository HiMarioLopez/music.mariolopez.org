import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { updateParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'update-song-limit' });
const tracer = new Tracer({ serviceName: 'update-song-limit' });
const metrics = new Metrics({ namespace: 'update-song-limit' });

const MIN_SONG_LIMIT = 5;
const MAX_SONG_LIMIT = 30;

/**
 * Lambda handler for updating song limit parameter
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

  logger.info('Update Song Limit Lambda invoked', { event });
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
          message: 'Request body is required',
        }),
      };
    }

    // Parse and validate song limit
    const body = JSON.parse(event.body);
    const songLimit = body.songLimit;

    if (
      typeof songLimit !== 'number' ||
      songLimit < MIN_SONG_LIMIT ||
      songLimit > MAX_SONG_LIMIT
    ) {
      logger.warn('Invalid song limit provided', { songLimit });
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, 'POST'),
        body: JSON.stringify({
          message: `Invalid song limit. Must be a number between ${MIN_SONG_LIMIT} and ${MAX_SONG_LIMIT}.`,
        }),
      };
    }

    // Update the parameter in SSM
    await updateParameter(parameterName, songLimit.toString());
    logger.info('Song limit updated successfully', { songLimit });
    metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        message: 'Song limit updated successfully',
        songLimit,
      }),
    };
  } catch (error) {
    logger.error('Error updating song limit', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'POST'),
      body: JSON.stringify({
        message: 'Error updating song limit',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
