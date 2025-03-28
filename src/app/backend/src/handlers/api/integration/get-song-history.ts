import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import {
  getAllSongs,
  getSongsByArtist,
} from '../../../services/dynamodb/song-history';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'get-song-history' });
const tracer = new Tracer({ serviceName: 'get-song-history' });
const metrics = new Metrics({ namespace: 'get-song-history' });

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
 * API Gateway handler function to fetch music history
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

  logger.info('Music History API Lambda invoked', { event });
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

    // Get artist filter if provided
    const artistName = queryParams.artist;

    // Get starting key for pagination if provided
    const startKey = queryParams.startKey
      ? decodeURIComponent(queryParams.startKey)
      : undefined;

    // Fetch songs from DynamoDB
    let result;
    if (artistName) {
      logger.info('Fetching songs by artist', { artistName, limit });
      result = await getSongsByArtist(tableName, artistName, limit, startKey);
      metrics.addMetric('ArtistFilteredQuery', MetricUnit.Count, 1);
    } else {
      logger.info('Fetching all songs', { limit });
      result = await getAllSongs(tableName, limit, startKey);
      metrics.addMetric('AllSongsQuery', MetricUnit.Count, 1);
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

    logger.info('Successfully returned song history', {
      count: result.items.length,
      hasMore: !!result.lastEvaluatedKey,
    });

    // Return songs as JSON response
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error fetching music history', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to fetch music history',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
