import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { updateParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const MIN_SONG_LIMIT = 5;
const MAX_SONG_LIMIT = 30;

/**
 * Lambda handler for updating song limit parameter
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>({ serviceName: 'set-song-limit' }, async (event, context, utils) => {
  const rateLimitResponse = await checkRateLimit(event, {
    ...RATE_LIMITS.ADMIN,
    logger: utils.logger,
    metrics: utils.metrics,
  });

  if (rateLimitResponse) {
    return rateLimitResponse as APIGatewayProxyResultV2;
  }

  // Get parameter name from environment
  const parameterName = utils.getRequiredEnvVar('PARAMETER_NAME');

  // Validate request body
  if (!event.body) {
    utils.logger.error('Missing request body');
    utils.metrics.addMetric('ValidationError', MetricUnit.Count, 1);
    return utils.createErrorResponse(
      event,
      new Error('Request body is required'),
      HttpStatus.BAD_REQUEST,
      'Request body is required'
    );
  }

  // Parse and validate song limit
  const body = JSON.parse(event.body);
  const songLimit = body.songLimit;

  if (
    typeof songLimit !== 'number' ||
    songLimit < MIN_SONG_LIMIT ||
    songLimit > MAX_SONG_LIMIT
  ) {
    utils.logger.warn('Invalid song limit provided', { songLimit });
    utils.metrics.addMetric('ValidationError', MetricUnit.Count, 1);
    return utils.createErrorResponse(
      event,
      new Error('Invalid song limit'),
      HttpStatus.BAD_REQUEST,
      `Invalid song limit. Must be a number between ${MIN_SONG_LIMIT} and ${MAX_SONG_LIMIT}.`
    );
  }

  // Update the parameter in SSM
  await updateParameter(parameterName, songLimit.toString());
  utils.logger.info('Song limit updated successfully', { songLimit });
  utils.metrics.addMetric('UpdateSuccess', MetricUnit.Count, 1);

  return utils.createSuccessResponse(event, {
    message: 'Song limit updated successfully',
    songLimit,
  });
});
