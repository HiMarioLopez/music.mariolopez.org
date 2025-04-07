import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { parsePath, processMusicBrainzRequest } from '@services/musicbrainz';
import { withCaching } from '@utils/cache';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { getPath } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for fetching data from MusicBrainz API
 * Implements caching and rate limiting
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>(
  { serviceName: 'musicbrainz-data-fetching' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.EXTERNAL_API,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResultV2;
    }

    // Use our caching utility to handle memory/Redis caching
    const response = await withCaching(
      event,
      async () => {
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};

        // Parse path to determine the MusicBrainz request
        const path = getPath(event);
        const options = parsePath(path, queryParams as Record<string, string>);

        // Use service to process the request with appropriate metrics
        const result = await processMusicBrainzRequest(options);

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

        return result;
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

    return response;
  }
);
