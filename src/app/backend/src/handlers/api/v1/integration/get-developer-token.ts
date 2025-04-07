import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { generateDeveloperToken } from '@services/developer-token';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for generating Apple Music developer tokens
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>({ serviceName: 'get-developer-token' }, async (event, context, utils) => {
  // Implement rate limiting
  const rateLimitResponse = await checkRateLimit(event, {
    ...RATE_LIMITS.EXTERNAL_API,
    logger: utils.logger,
    metrics: utils.metrics,
  });

  if (rateLimitResponse) {
    return rateLimitResponse as APIGatewayProxyResultV2;
  }

  try {
    // Get and validate required environment variables
    const authKeySecretName = utils.getRequiredEnvVar(
      'APPLE_AUTH_KEY_SECRET_NAME'
    );
    const teamId = utils.getRequiredEnvVar('APPLE_TEAM_ID');
    const keyId = utils.getRequiredEnvVar('APPLE_KEY_ID');

    if (!authKeySecretName || !teamId || !keyId) {
      return utils.createErrorResponse(
        event,
        new Error('Missing required environment variables'),
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Server configuration error'
      );
    }

    // Generate the developer token
    utils.logger.info('Generating developer token');
    utils.metrics.addMetric('TokenGenerationAttempt', MetricUnit.Count, 1);

    const token = await generateDeveloperToken({
      APPLE_AUTH_KEY_SECRET_NAME: authKeySecretName,
      APPLE_TEAM_ID: teamId,
      APPLE_KEY_ID: keyId,
    });

    utils.logger.info('Developer token generated successfully');
    utils.metrics.addMetric('TokenGenerationSuccess', MetricUnit.Count, 1);

    // Return the token
    return utils.createSuccessResponse(event, { token }, HttpStatus.OK, {
      'Cache-Control': 'private, max-age=43200', // 12 hours
    });
  } catch (error: any) {
    utils.logger.error('Error generating developer token', { error });
    utils.metrics.addMetric('TokenGenerationError', MetricUnit.Count, 1);

    return utils.createErrorResponse(
      event,
      error,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to generate developer token'
    );
  }
});
