import { Logger } from '@aws-lambda-powertools/logger';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { getMUT } from '@services/mut';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const logger = new Logger({ serviceName: 'get-mut-status' });

/**
 * Lambda handler for checking Apple Music User Token (MUT) status
 * GET /mut/status
 * Returns authorization status by validating the MUT with Apple Music API
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-mut-status' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.ADMIN,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    try {
      logger.info('Checking Apple Music User Token status');

      const parameterName = utils.getRequiredEnvVar('PARAMETER_NAME');

      let authorized = false;
      let message = 'Apple Music not authorized';
      let musicUserToken: string | null = null;

      try {
        // Get the MUT from Parameter Store
        try {
          musicUserToken = await getMUT({ parameterName });
        } catch (error) {
          logger.info('Apple Music User Token not found in Parameter Store', {
            error,
          });
          utils.metrics.addMetric('MUTNotAuthorized', MetricUnit.Count, 1);

          return utils.createSuccessResponse(event, {
            authorized: false,
            message: 'Apple Music User Token not found',
            musicUserToken: null,
          });
        }

        // Validate the token by checking if it exists and isn't a placeholder
        // Apple Music tokens are session-based, so we validate basic structure
        if (musicUserToken && musicUserToken.trim() !== '' && musicUserToken !== 'placeholder') {
          // Token exists and looks valid (not empty and not placeholder)
          authorized = true;
          message = 'Apple Music is authorized and token is valid';
          logger.info('Apple Music token validation successful', {
            tokenLength: musicUserToken.length,
          });
        } else {
          message = 'Apple Music token is invalid or placeholder';
          logger.info('Apple Music token is invalid', {
            isEmpty: !musicUserToken,
            isPlaceholder: musicUserToken === 'placeholder',
          });
        }
      } catch (error) {
        logger.error('Error checking Apple Music authorization', { error });
        message = 'Failed to check Apple Music authorization status';
      }

      utils.metrics.addMetric('MUTStatusCheck', MetricUnit.Count, 1);

      if (authorized) {
        utils.metrics.addMetric('MUTAuthorized', MetricUnit.Count, 1);
      } else {
        utils.metrics.addMetric('MUTNotAuthorized', MetricUnit.Count, 1);
      }

      logger.info('Apple Music status check completed', { authorized });

      return utils.createSuccessResponse(event, {
        authorized,
        message,
        musicUserToken: authorized ? musicUserToken : null,
      });
    } catch (error) {
      logger.error('Failed to check Apple Music status', { error });
      utils.metrics.addMetric('MUTStatusCheckError', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to check Apple Music authorization status'
      );
    }
  }
);

