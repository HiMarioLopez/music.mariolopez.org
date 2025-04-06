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
import { RecommendationNote, ModerationStatus } from '../../../models/note';
import { PaginatedResponse } from '../../../models/paginated-response';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const logger = new Logger({ serviceName: 'get-recommendation-notes' });
const tracer = new Tracer({ serviceName: 'get-recommendation-notes' });
const metrics = new Metrics({ namespace: 'get-recommendation-notes' });

// Default limit for note queries
const DEFAULT_LIMIT = 50;

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * API Gateway handler function to fetch recommendation notes
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

  logger.info('Recommendation Notes API Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_NOTES_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_NOTES_TABLE_NAME_PARAMETER'
      );
    }

    const moderationIndexNameParameter =
      process.env.DYNAMODB_NOTES_MODERATION_INDEX_NAME_PARAMETER;
    if (!moderationIndexNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_NOTES_MODERATION_INDEX_NAME_PARAMETER'
      );
    }

    const userNotesIndexNameParameter =
      process.env.DYNAMODB_NOTES_MARIO_INDEX_NAME_PARAMETER;
    if (!userNotesIndexNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_NOTES_MARIO_INDEX_NAME_PARAMETER'
      );
    }

    // Get the table name from SSM Parameter Store
    const tableName = await getParameter(tableNameParameter);

    if (!tableName) {
      throw new Error(
        `Failed to retrieve DynamoDB table name from parameter: ${tableNameParameter}`
      );
    }

    // Get index names from parameters
    let moderationIndexName: string;
    let userNotesIndexName: string;

    try {
      const moderationIndexNameFromParam = await getParameter(
        moderationIndexNameParameter
      );
      if (!moderationIndexNameFromParam) {
        logger.warn(
          `Failed to retrieve moderation index name from parameter: ${moderationIndexNameParameter}, using fallback value`
        );
        moderationIndexName = 'NoteModerationStatusIndex'; // Fallback value
      } else {
        moderationIndexName = moderationIndexNameFromParam;
      }
    } catch (error) {
      logger.warn(
        `Error retrieving moderation index name from parameter: ${error}, using fallback value`
      );
      moderationIndexName = 'NoteModerationStatusIndex'; // Fallback value
    }

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
    const moderationStatus = queryParams.moderationStatus as
      | ModerationStatus
      | undefined;
    const isFromUser =
      queryParams.isFromUser !== undefined
        ? queryParams.isFromUser === 'true'
        : undefined;

    // Get starting key for pagination if provided
    const startKey = queryParams.startKey
      ? decodeURIComponent(queryParams.startKey)
      : undefined;

    // Check if we're fetching a specific note by ID
    if (recommendationId && noteId) {
      logger.info('Fetching note by ID', {
        recommendationId,
        noteId,
      });

      const note = await getNoteById(tableName, recommendationId, noteId);

      if (!note) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
          body: JSON.stringify({
            message: `Note with ID ${noteId} for recommendation ${recommendationId} not found`,
          }),
        };
      }

      metrics.addMetric('NoteByIdQuery', MetricUnit.Count, 1);

      // Return the single note
      return {
        statusCode: 200,
        headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
        body: JSON.stringify({
          item: note,
        }),
      };
    }

    // Fetch notes from DynamoDB
    let result;

    // Determine which query function to use based on filters
    if (recommendationId) {
      // Get all notes for a specific recommendation
      logger.info('Fetching notes by recommendationId', {
        recommendationId,
        limit,
      });
      result = await getNotesByRecommendationId(
        tableName,
        recommendationId,
        limit,
        startKey
      );
      metrics.addMetric('NotesByRecommendationIdQuery', MetricUnit.Count, 1);
    } else if (moderationStatus) {
      // Validate moderationStatus parameter
      if (
        !['APPROVED', 'PENDING_REVIEW', 'REJECTED'].includes(moderationStatus)
      ) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
          body: JSON.stringify({
            message:
              'Invalid moderationStatus parameter. Must be one of: APPROVED, PENDING_REVIEW, REJECTED',
          }),
        };
      }

      // Get notes by moderation status
      logger.info('Fetching notes by moderation status', {
        moderationStatus,
        limit,
      });
      result = await getNotesByModerationStatus(
        tableName,
        moderationIndexName,
        moderationStatus,
        limit,
        startKey
      );
      metrics.addMetric('NotesByModerationStatusQuery', MetricUnit.Count, 1);
    } else if (isFromUser !== undefined) {
      // Get notes by Mario status
      logger.info('Fetching notes by Mario status', {
        isFromUser,
        limit,
      });
      result = await getNotesByMarioStatus(
        tableName,
        userNotesIndexName,
        isFromUser,
        limit,
        startKey
      );
      metrics.addMetric('NotesByMarioStatusQuery', MetricUnit.Count, 1);
    } else {
      // This is a fallback case - in practice, you should always filter notes
      logger.warn(
        'No filters provided for notes query, returning empty result'
      );
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
        body: JSON.stringify({
          message:
            'At least one filter (recommendationId, moderationStatus, or isFromUser) is required',
        }),
      };
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

    logger.info('Successfully returned notes', {
      count: result.items.length,
      hasMore: !!result.lastEvaluatedKey,
    });

    // Return notes as JSON response
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error fetching notes', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'GET,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to fetch notes',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Get a specific note by recommendationId and noteId
 */
async function getNoteById(
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
