import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import {
  getAllRecommendations,
  getRecommendationsByEntityType,
  getRecommendationsByFrom,
} from '../../../services/dynamodb/recommendations';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'get-recommendations' });
const tracer = new Tracer({ serviceName: 'get-recommendations' });
const metrics = new Metrics({ namespace: 'get-recommendations' });

// Default limit for queries
const DEFAULT_LIMIT = 50;

// Define response type
interface PaginatedResponse {
  items: any[];
  pagination: {
    count: number;
    hasMore: boolean;
    nextToken?: string;
  };
}

/**
 * API Gateway handler function to fetch recommendations
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Recommendations API Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_TABLE_NAME_PARAMETER'
      );
    }

    // Get the table name from SSM Parameter Store using our parameter service
    const tableName = await getParameter(tableNameParameter);

    if (!tableName) {
      throw new Error(
        `Failed to retrieve DynamoDB table name from parameter: ${tableNameParameter}`
      );
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};

    // Parse limit with fallback to default
    const limit = queryParams.limit
      ? parseInt(queryParams.limit, 10)
      : DEFAULT_LIMIT;

    // Get filters if provided
    const entityType = queryParams.entityType as
      | 'SONG'
      | 'ALBUM'
      | 'ARTIST'
      | undefined;
    const from = queryParams.from;

    // Get starting key for pagination if provided
    const startKey = queryParams.startKey
      ? decodeURIComponent(queryParams.startKey)
      : undefined;

    // Fetch recommendations from DynamoDB sorted by votes
    let result;

    // Determine which query function to use based on filters
    if (entityType) {
      // Validate entityType parameter
      if (!['SONG', 'ALBUM', 'ARTIST'].includes(entityType)) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
          body: JSON.stringify({
            message:
              'Invalid entityType parameter. Must be one of: SONG, ALBUM, ARTIST',
          }),
        };
      }

      logger.info('Fetching recommendations by entityType, sorted by votes', {
        entityType,
        limit,
      });
      result = await getRecommendationsByEntityType(
        tableName,
        entityType,
        limit,
        startKey
      );
      metrics.addMetric('EntityTypeVotesFilteredQuery', MetricUnit.Count, 1);
    } else if (from) {
      logger.info('Fetching recommendations by creator, sorted by votes', {
        from,
        limit,
      });
      result = await getRecommendationsByFrom(tableName, from, limit, startKey);
      metrics.addMetric('FromVotesFilteredQuery', MetricUnit.Count, 1);
    } else {
      logger.info('Fetching all recommendations sorted by votes', { limit });
      result = await getAllRecommendations(tableName, limit, startKey);
      metrics.addMetric('AllRecommendationsByVotesQuery', MetricUnit.Count, 1);
    }

    // Record the number of results returned
    metrics.addMetric('ResultCount', MetricUnit.Count, result.items.length);

    // Prepare pagination info
    const response: PaginatedResponse = {
      items: result.items,
      pagination: {
        count: result.items.length,
        hasMore: !!result.lastEvaluatedKey,
      },
    };

    // Add next page token if there are more results
    if (result.lastEvaluatedKey) {
      response.pagination.nextToken = encodeURIComponent(
        result.lastEvaluatedKey
      );
    }

    logger.info('Successfully returned recommendations', {
      count: result.items.length,
      hasMore: !!result.lastEvaluatedKey,
    });

    // Return recommendations as JSON response
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error fetching recommendations', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to fetch recommendations',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
