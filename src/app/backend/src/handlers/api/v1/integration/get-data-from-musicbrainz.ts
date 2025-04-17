import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { parsePath, processMusicBrainzRequest } from '@services/musicbrainz';
import { withCaching } from '@utils/cache';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lambda handler for fetching data from MusicBrainz API
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-data-from-musicbrainz' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.EXTERNAL_API,
      logger: utils.logger,
      metrics: utils.metrics,
    });
    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    try {
      const result = await withCaching(
        event,
        async () => {
          // Parse query parameters
          const queryParams = event.queryStringParameters || {};
          // Parse path to determine the MusicBrainz request
          const options = parsePath(
            event.path,
            queryParams as Record<string, string>
          );
          // Use service to process the request with appropriate metrics
          const response = await processMusicBrainzRequest(options);

          // Record appropriate metrics based on the request type
          if (options.query) {
            utils.metrics.addMetric('SearchRequest', MetricUnit.Count, 1);
          } else if (options.mbid) {
            utils.metrics.addMetric('LookupRequest', MetricUnit.Count, 1);
          } else if (Object.keys(options.params || {}).length > 0) {
            utils.metrics.addMetric('BrowseRequest', MetricUnit.Count, 1);
          } else {
            utils.metrics.addMetric('DirectApiCall', MetricUnit.Count, 1);
          }

          return response;
        },
        {
          stripPrefix: '/api',
          includeMethod: true,
          includeQuery: true,
          ttlSeconds: 3600, // Cache for 1 hour
          logger: utils.logger,
          metrics: utils.metrics,
        }
      );

      return utils.createSuccessResponse(
        event,
        { data: result.data, source: result.source },
        result.statusCode,
        result.headers
      );
    } catch (error: any) {
      utils.logger.error('Error processing MusicBrainz request', { error });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);
      return utils.createErrorResponse(
        event,
        error,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error.message || 'Internal server error'
      );
    }
  }
);
