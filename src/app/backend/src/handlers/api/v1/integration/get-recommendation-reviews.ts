import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { RecommendationNote } from '@models/note';
import { wrapHandler } from '@utils/lambda-handler';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Default limit for review queries
const DEFAULT_LIMIT = 50;

/**
 * API Gateway handler function to fetch recommendation reviews
 * Reviews are notes with isFromUser=true
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-recommendation-reviews' },
  async (event, context, utils) => {
    try {
      // Initialize DynamoDB client with tracer
      const ddbClient = new DynamoDBClient({});
      const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
      utils.tracer.captureAWSv3Client(ddbClient);
      utils.tracer.captureAWSv3Client(ddbDocClient);

      // Get required environment variables
      const tableNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_NOTES_TABLE_NAME_PARAMETER'
      );
      const userNotesIndexNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_NOTES_USER_INDEX_NAME_PARAMETER'
      );

      // Get the table name from SSM Parameter Store
      const tableName = await utils.getRequiredParameter(tableNameParameter);

      // Get index name from parameter with fallback
      let userNotesIndexName: string;

      try {
        userNotesIndexName = await utils.getRequiredParameter(
          userNotesIndexNameParameter,
          'UserNotesIndex' // Fallback value
        );
      } catch (error) {
        utils.logger.warn(
          `Error retrieving user notes index name from parameter, using fallback value`,
          { error }
        );
        userNotesIndexName = 'UserNotesIndex'; // Fallback value
      }

      // Parse query parameters
      const { queryParams, limit, startKey } = utils.parseQueryParams(
        event,
        DEFAULT_LIMIT
      );

      // Get specific filters if provided
      const recommendationId = queryParams.recommendationId;
      const noteId = queryParams.noteId;

      let result;

      // Determine which query function to use based on filters
      if (noteId && recommendationId) {
        // Get a specific review by ID
        utils.logger.info('Fetching review by ID', {
          recommendationId,
          noteId,
        });

        const review = await getReviewById(tableName, recommendationId, noteId);

        if (!review) {
          return utils.createErrorResponse(
            event,
            new Error(`Review with ID ${noteId} not found`),
            HttpStatus.NOT_FOUND,
            `Review with ID ${noteId} not found`
          );
        }

        utils.metrics.addMetric('ReviewByIdQuery', MetricUnit.Count, 1);

        // Return the single review
        return utils.createSuccessResponse(event, { item: review });
      } else if (recommendationId) {
        // Get all reviews for a specific recommendation
        utils.logger.info('Fetching reviews by recommendation ID', {
          recommendationId,
          limit,
        });

        result = await getReviewsByRecommendationId(
          tableName,
          recommendationId,
          limit,
          startKey
        );
        utils.metrics.addMetric(
          'ReviewsByRecommendationIdQuery',
          MetricUnit.Count,
          1
        );
      } else {
        // Get all reviews (notes with isFromUser=true)
        utils.logger.info('Fetching all reviews', {
          limit,
        });
        result = await getAllReviews(
          tableName,
          userNotesIndexName,
          limit,
          startKey
        );
        utils.metrics.addMetric('AllReviewsQuery', MetricUnit.Count, 1);
      }

      // Record the number of results
      utils.metrics.addMetric(
        'ResultCount',
        MetricUnit.Count,
        result.items.length
      );

      // Format the paginated response
      const lastEvaluatedKey = result.lastEvaluatedKey
        ? JSON.stringify(result.lastEvaluatedKey)
        : undefined;

      const response = utils.formatPaginatedResponse(
        result.items,
        lastEvaluatedKey
      );

      utils.logger.info('Successfully returned reviews', {
        count: result.items.length,
        hasMore: !!result.lastEvaluatedKey,
      });

      // Return reviews as JSON response
      return utils.createSuccessResponse(event, response);
    } catch (error) {
      utils.logger.error('Error fetching reviews', { error });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to fetch reviews'
      );
    }
  }
);

/**
 * Get a specific review by recommendationId and noteId
 */
async function getReviewById(
  tableName: string,
  recommendationId: string,
  noteId: string
): Promise<RecommendationNote | null> {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

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
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

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
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

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
