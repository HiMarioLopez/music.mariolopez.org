import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { ModerationStatus, RecommendationNote } from '@models/note';
import { wrapHandler } from '@utils/lambda-handler';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// Default limit for note queries
const DEFAULT_LIMIT = 50;

/**
 * API Gateway handler function to fetch recommendation notes
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>(
  { serviceName: 'get-recommendation-notes' },
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
      const moderationIndexNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_NOTES_MODERATION_INDEX_NAME_PARAMETER'
      );
      const userNotesIndexNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_NOTES_USER_INDEX_NAME_PARAMETER'
      );

      // Get the table name from SSM Parameter Store
      const tableName = await utils.getRequiredParameter(tableNameParameter);

      // Get index names from parameters with fallbacks
      let moderationIndexName: string;
      let userNotesIndexName: string;

      try {
        moderationIndexName = await utils.getRequiredParameter(
          moderationIndexNameParameter,
          'NoteModerationStatusIndex' // Fallback value
        );
      } catch (error) {
        utils.logger.warn(
          `Error retrieving moderation index name from parameter, using fallback value`,
          { error }
        );
        moderationIndexName = 'NoteModerationStatusIndex'; // Fallback value
      }

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
      const moderationStatus = queryParams.moderationStatus as ModerationStatus;
      const userNotes =
        queryParams.userNotes !== undefined
          ? queryParams.userNotes === 'true'
          : undefined;

      let result;

      // Determine which query function to use based on filters
      if (noteId && recommendationId) {
        // Get a specific note by ID
        utils.logger.info('Fetching note by ID', {
          recommendationId,
          noteId,
        });

        const note = await getNoteById(tableName, recommendationId, noteId);

        if (!note) {
          return utils.createErrorResponse(
            event,
            new Error(`Note with ID ${noteId} not found`),
            HttpStatus.NOT_FOUND,
            `Note with ID ${noteId} not found`
          );
        }

        utils.metrics.addMetric('NoteByIdQuery', MetricUnit.Count, 1);

        // Return the single note
        return utils.createSuccessResponse(event, { item: note });
      } else if (recommendationId) {
        // Get all notes for a specific recommendation
        utils.logger.info('Fetching notes by recommendation ID', {
          recommendationId,
          limit,
        });

        result = await getNotesByRecommendationId(
          tableName,
          recommendationId,
          limit,
          startKey
        );
        utils.metrics.addMetric(
          'NotesByRecommendationIdQuery',
          MetricUnit.Count,
          1
        );
      } else if (moderationStatus) {
        // Get notes by moderation status
        utils.logger.info('Fetching notes by moderation status', {
          moderationStatus,
          limit,
        });

        // Validate moderationStatus
        if (!['pending', 'approved', 'rejected'].includes(moderationStatus)) {
          return utils.createErrorResponse(
            event,
            new Error('Invalid moderationStatus parameter'),
            HttpStatus.BAD_REQUEST,
            'Invalid moderationStatus parameter. Must be one of: pending, approved, rejected'
          );
        }

        result = await getNotesByModerationStatus(
          tableName,
          moderationIndexName,
          moderationStatus,
          limit,
          startKey
        );
        utils.metrics.addMetric(
          'NotesByModerationStatusQuery',
          MetricUnit.Count,
          1
        );
      } else if (userNotes !== undefined) {
        // Get notes by Mario status
        utils.logger.info('Fetching notes by user status', {
          userNotes,
          limit,
        });

        result = await getNotesByMarioStatus(
          tableName,
          userNotesIndexName,
          userNotes,
          limit,
          startKey
        );
        utils.metrics.addMetric('NotesByUserStatusQuery', MetricUnit.Count, 1);
      } else {
        return utils.createErrorResponse(
          event,
          new Error('Missing filter parameters'),
          HttpStatus.BAD_REQUEST,
          'At least one filter parameter is required: recommendationId, moderationStatus, or userNotes'
        );
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

      utils.logger.info('Successfully returned notes', {
        count: result.items.length,
        hasMore: !!result.lastEvaluatedKey,
      });

      // Return notes as JSON response
      return utils.createSuccessResponse(event, response);
    } catch (error) {
      utils.logger.error('Error fetching notes', { error });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to fetch notes'
      );
    }
  }
);

/**
 * Get a specific note by recommendationId and noteId
 */
async function getNoteById(
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
  return (response.Item as RecommendationNote) || null;
}

/**
 * Get all notes for a specific recommendation
 */
async function getNotesByRecommendationId(
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
    ExpressionAttributeValues: {
      ':recommendationId': recommendationId,
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
 * Get notes by moderation status
 */
async function getNotesByModerationStatus(
  tableName: string,
  indexName: string,
  moderationStatus: ModerationStatus,
  limit: number,
  startKey?: string
): Promise<{ items: RecommendationNote[]; lastEvaluatedKey?: any }> {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const command = new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: 'moderationStatus = :moderationStatus',
    ExpressionAttributeValues: {
      ':moderationStatus': moderationStatus,
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

/**
 * Get notes by Mario status
 */
async function getNotesByMarioStatus(
  tableName: string,
  indexName: string,
  isFromUser: boolean,
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
      ':isFromUser': isFromUser ? 1 : 0, // DynamoDB doesn't support boolean types
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
