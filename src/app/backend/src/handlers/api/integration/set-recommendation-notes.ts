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
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { generateUUID } from '../../../utils/uuid';

const logger = new Logger({ serviceName: 'set-recommendation-notes' });
const tracer = new Tracer({ serviceName: 'set-recommendation-notes' });
const metrics = new Metrics({ namespace: 'set-recommendation-notes' });

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * API Gateway handler function to create or update a recommendation note
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

  logger.info('Set Recommendation Note Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_NOTES_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_NOTES_TABLE_NAME_PARAMETER'
      );
    }

    // Get DynamoDB table name from Parameter Store
    logger.info('Retrieving table name from parameter', { tableNameParameter });
    const tableName = await getParameter(tableNameParameter);

    if (!tableName) {
      throw new Error(
        `Failed to retrieve DynamoDB table name from parameter: ${tableNameParameter}`
      );
    }

    // Parse the request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Request body is required',
        }),
      };
    }

    const requestBody = JSON.parse(event.body);

    // Log the full request body for debugging
    logger.info('Request body parsed', {
      requestBody: JSON.stringify(requestBody),
    });

    // Validate required fields
    if (!requestBody.recommendationId) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'recommendationId is required in request body',
        }),
      };
    }

    if (!requestBody.note) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'note content is required in request body',
        }),
      };
    }

    // Check if we're updating an existing note by ID
    if (requestBody.noteId) {
      logger.info('Updating note by ID', {
        recommendationId: requestBody.recommendationId,
        noteId: requestBody.noteId,
      });

      // Get the existing note
      const existingNote = await getNoteById(
        tableName,
        requestBody.recommendationId,
        requestBody.noteId
      );

      if (!existingNote) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
          body: JSON.stringify({
            message: `Note with ID ${requestBody.noteId} for recommendation ${requestBody.recommendationId} not found`,
          }),
        };
      }

      // Prepare updates
      const updates: Partial<RecommendationNote> = {};

      // Handle note content update
      if (requestBody.note) {
        updates.note = requestBody.note;
      }

      // Handle moderation status update
      if (requestBody.moderationStatus) {
        if (
          !['APPROVED', 'PENDING_REVIEW', 'REJECTED'].includes(
            requestBody.moderationStatus
          )
        ) {
          return {
            statusCode: 400,
            headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
            body: JSON.stringify({
              message:
                'moderationStatus must be one of: APPROVED, PENDING_REVIEW, or REJECTED',
            }),
          };
        }
        updates.moderationStatus =
          requestBody.moderationStatus as ModerationStatus;
      }

      // Handle moderation details update
      if (requestBody.moderationDetails) {
        updates.moderationDetails = {
          ...existingNote.moderationDetails,
          ...requestBody.moderationDetails,
        };
      }

      // Update the note
      const result = await updateNote(
        tableName,
        requestBody.recommendationId,
        requestBody.noteId,
        updates
      );

      metrics.addMetric('NoteUpdateCount', MetricUnit.Count, 1);

      logger.info('Successfully updated note by ID', {
        recommendationId: result.recommendationId,
        noteId: result.noteId,
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Note updated successfully.',
          note: result,
        }),
      };
    }

    // Create a new note
    logger.info('Creating new note', {
      recommendationId: requestBody.recommendationId,
    });

    // Generate a new note ID
    const noteId = generateUUID();

    // Create the note object
    const newNote: RecommendationNote = {
      recommendationId: requestBody.recommendationId,
      noteId,
      from: requestBody.from || 'anonymous',
      note: requestBody.note,
      isFromMario: requestBody.isFromMario || false,
      noteTimestamp: new Date().toISOString(),
      moderationStatus: requestBody.moderationStatus || 'PENDING_REVIEW',
      moderationDetails: requestBody.moderationDetails || {},
    };

    // Store in DynamoDB
    const result = await createNote(tableName, newNote);

    metrics.addMetric('NoteCreateCount', MetricUnit.Count, 1);

    logger.info('Successfully created note', {
      recommendationId: result.recommendationId,
      noteId: result.noteId,
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Note created successfully.',
        note: result,
      }),
    };
  } catch (error) {
    logger.error('Error processing note', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to process note',
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
 * Create a new note
 */
async function createNote(
  tableName: string,
  note: RecommendationNote
): Promise<RecommendationNote> {
  const command = new PutCommand({
    TableName: tableName,
    Item: note,
  });

  await ddbDocClient.send(command);
  return note;
}

/**
 * Update an existing note
 */
async function updateNote(
  tableName: string,
  recommendationId: string,
  noteId: string,
  updates: Partial<RecommendationNote>
): Promise<RecommendationNote> {
  // Build update expression
  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Add each field to update
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateExpressionParts.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  // If no updates, return the existing note
  if (updateExpressionParts.length === 0) {
    return getNoteById(
      tableName,
      recommendationId,
      noteId
    ) as Promise<RecommendationNote>;
  }

  const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      recommendationId,
      noteId,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const response = await ddbDocClient.send(command);
  return response.Attributes as RecommendationNote;
}
