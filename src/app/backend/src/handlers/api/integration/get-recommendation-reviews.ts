import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';
import { RecommendationNote } from '../../../models/note';
import { PaginatedResponse } from '../../../models/paginated-response';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const logger = new Logger({ serviceName: 'get-recommendation-reviews' });
const tracer = new Tracer({ serviceName: 'get-recommendation-reviews' });
const metrics = new Metrics({ namespace: 'get-recommendation-reviews' });

// Default limit for review queries
const DEFAULT_LIMIT = 50;

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * API Gateway handler function to fetch recommendation reviews
 * Reviews are notes with isFromUser=true
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

  logger.info('Recommendation Reviews API Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_NOTES_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_NOTES_TABLE_NAME_PARAMETER'
      );
    }

    const userNotesIndexNameParameter =
      process.env.DYNAMODB_NOTES_USER_INDEX_NAME_PARAMETER;
    if (!userNotesIndexNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_NOTES_USER_INDEX_NAME_PARAMETER'
      );
    }

    // Get the table name from SSM Parameter Store
    const tableName = await getParameter(tableNameParameter);

    if (!tableName) {
      throw new Error(
        `Failed to retrieve DynamoDB table name from parameter: ${tableNameParameter}`
      );
    }

    // Get index name from parameter
    let userNotesIndexName: string;

    try {
      const userNotesIndexNameFromParam = await getParameter(
        userNotesIndexNameParameter
      );
      if (!userNotesIndexNameFromParam) {
        logger.warn(
          `Failed to retrieve Mario notes index name from parameter: ${userNotesIndexNameParameter}, using fallback value`
        );
        userNotesIndexName = 'UserNotesIndex'; // Fallback value
      } else {
        userNotesIndexName = userNotesIndexNameFromParam;
      }
    } catch (error) {
      logger.warn(
        `Error retrieving Mario notes index name from parameter: ${error}, using fallback value`
      );
      userNotesIndexName = 'UserNotesIndex'; // Fallback value
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};

    // Parse limit with fallback to default
    const limit = queryParams.limit
      ? parseInt(queryParams.limit, 10)
      : DEFAULT_LIMIT;

    // Get filters if provided
    const recommendationId = queryParams.recommendationId;
    const noteId = queryParams.noteId;

    // Get starting key for pagination if provided
    const startKey = queryParams.startKey
      ? decodeURIComponent(queryParams.startKey)
      : undefined;

    // Check if we're fetching a specific review by ID
    if (recommendationId && noteId) {
      logger.info('Fetching review by ID', {
        recommendationId,
        noteId,
      });

      const review = await getReviewById(tableName, recommendationId, noteId);

      if (!review) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
          body: JSON.stringify({
            message: `Review with ID ${noteId} for recommendation ${recommendationId} not found`,
          }),
        };
      }

      metrics.addMetric('ReviewByIdQuery', MetricUnit.Count, 1);

      // Return the single review
      return {
        statusCode: 200,
        headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
        body: JSON.stringify({
          item: review,
        }),
      };
    }

    // Fetch reviews from DynamoDB
    let result;

    // Determine which query function to use based on filters
    if (recommendationId) {
      // Get all reviews for a specific recommendation
      logger.info('Fetching reviews by recommendationId', {
        recommendationId,
        limit,
      });
      result = await getReviewsByRecommendationId(
        tableName,
        recommendationId,
        limit,
        startKey
      );
      metrics.addMetric('ReviewsByRecommendationIdQuery', MetricUnit.Count, 1);
    } else {
      // Get all reviews (notes with isFromUser=true)
      logger.info('Fetching all reviews', {
        limit,
      });
      result = await getAllReviews(
        tableName,
        userNotesIndexName,
        limit,
        startKey
      );
      metrics.addMetric('AllReviewsQuery', MetricUnit.Count, 1);
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
        JSON.stringify(result.lastEvaluatedKey)
      );
    }

    logger.info('Successfully returned reviews', {
      count: result.items.length,
      hasMore: !!result.lastEvaluatedKey,
    });

    // Return reviews as JSON response
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error fetching reviews', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to fetch reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Get a specific review by recommendationId and noteId
 */
async function getReviewById(
  tableName: string,
  recommendationId: string,
  noteId: string
): Promise<RecommendationNote | null> {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      recommendationId,
      noteId,
    },
  });

  const response = await ddbDocClient.send(command);
  const note = response.Item as RecommendationNote;

  // Only return if it's a review (isFromUser=true)
  return note && note.isFromUser ? note : null;
}

/**
 * Get all reviews for a specific recommendation
 */
async function getReviewsByRecommendationId(
  tableName: string,
  recommendationId: string,
  limit: number,
  startKey?: string
): Promise<{ items: RecommendationNote[]; lastEvaluatedKey?: any }> {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'recommendationId = :recommendationId',
    FilterExpression: 'isFromUser = :isFromUser',
    ExpressionAttributeValues: {
      ':recommendationId': recommendationId,
      ':isFromUser': 1, // DynamoDB doesn't support boolean types
    },
    Limit: limit,
    ScanIndexForward: false, // Sort by noteId in descending order (newest first)
    ...(startKey && { ExclusiveStartKey: JSON.parse(startKey) }),
  });

  const response = await ddbDocClient.send(command);
  return {
    items: response.Items as RecommendationNote[],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Get all reviews (notes with isFromUser=true)
 */
async function getAllReviews(
  tableName: string,
  indexName: string,
  limit: number,
  startKey?: string
): Promise<{ items: RecommendationNote[]; lastEvaluatedKey?: any }> {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: 'isFromUser = :isFromUser',
    ExpressionAttributeValues: {
      ':isFromUser': 1, // DynamoDB doesn't support boolean types
    },
    Limit: limit,
    ScanIndexForward: false, // Sort by noteTimestamp in descending order (newest first)
    ...(startKey && { ExclusiveStartKey: JSON.parse(startKey) }),
  });

  const response = await ddbDocClient.send(command);
  return {
    items: response.Items as RecommendationNote[],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}
