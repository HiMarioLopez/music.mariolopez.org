import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ModerationStatus, RecommendationNote } from '@models/note';
import { checkModeration } from '@services/openai/moderation';
import { wrapHandler } from '@utils/lambda-handler';
import { HttpStatus } from '@utils/types';
import { generateUUID } from '@utils/uuid';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * API Gateway handler function to create or update a recommendation note
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>(
  { serviceName: 'set-recommendation-notes' },
  async (event, context, utils) => {
    try {
      // Initialize DynamoDB client with tracer
      const ddbClient = new DynamoDBClient({});
      const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
      utils.tracer.captureAWSv3Client(ddbClient);
      utils.tracer.captureAWSv3Client(ddbDocClient);

      // Get DynamoDB table name from Parameter Store
      const tableNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_NOTES_TABLE_NAME_PARAMETER'
      );
      utils.logger.info('Retrieving table name from parameter', {
        tableNameParameter,
      });
      const tableName = await utils.getRequiredParameter(tableNameParameter);

      // Parse the request body
      if (!event.body) {
        return utils.createErrorResponse(
          event,
          new Error('Request body is required'),
          HttpStatus.BAD_REQUEST,
          'Request body is required'
        );
      }

      const requestBody = JSON.parse(event.body);

      // Log the full request body for debugging
      utils.logger.info('Request body parsed', {
        requestBody: JSON.stringify(requestBody),
      });

      // Validate required fields
      if (!requestBody.recommendationId) {
        return utils.createErrorResponse(
          event,
          new Error('recommendationId is required'),
          HttpStatus.BAD_REQUEST,
          'recommendationId is required in request body'
        );
      }

      if (!requestBody.note) {
        return utils.createErrorResponse(
          event,
          new Error('note content is required'),
          HttpStatus.BAD_REQUEST,
          'note content is required in request body'
        );
      }

      // Check if we're updating an existing note by ID
      if (requestBody.noteId) {
        utils.logger.info('Updating note by ID', {
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
          return utils.createErrorResponse(
            event,
            new Error(`Note with ID ${requestBody.noteId} not found`),
            HttpStatus.NOT_FOUND,
            `Note with ID ${requestBody.noteId} for recommendation ${requestBody.recommendationId} not found`
          );
        }

        // Prepare updates
        const updates: Partial<RecommendationNote> = {};

        // Handle note content update
        if (requestBody.note !== existingNote.note) {
          updates.note = requestBody.note;

          // Update timestamp
          updates.noteTimestamp = new Date().toISOString();

          // Reset moderation status if note content changes
          if (requestBody.moderationStatus) {
            updates.moderationStatus = requestBody.moderationStatus;
          } else {
            // Check content with moderation service
            try {
              const moderationResult = await checkModeration(requestBody.note);
              utils.logger.info('Moderation check completed', {
                moderationResult,
              });

              if (moderationResult.flagged) {
                updates.moderationStatus = 'PENDING_REVIEW';
                updates.moderationDetails = {
                  flaggedCategories: moderationResult.flags,
                  flaggedTimestamp: new Date().toISOString(),
                };

                utils.logger.info('Content flagged by moderation', {
                  recommendationId: requestBody.recommendationId,
                  noteId: requestBody.noteId,
                  flags: moderationResult.flags,
                });
              } else {
                updates.moderationStatus = 'APPROVED';
                updates.moderationDetails = undefined;
                utils.logger.info('Content passed moderation check', {
                  recommendationId: requestBody.recommendationId,
                  noteId: requestBody.noteId,
                });
              }
            } catch (error) {
              utils.logger.warn(
                'Moderation check failed, using default status',
                { error }
              );
              updates.moderationStatus = 'PENDING_REVIEW';
            }
          }
        }

        // Handle other field updates
        if (
          requestBody.from !== undefined &&
          requestBody.from !== existingNote.from
        ) {
          updates.from = requestBody.from;
        }

        if (
          requestBody.isFromUser !== undefined &&
          requestBody.isFromUser !== existingNote.isFromUser
        ) {
          updates.isFromUser = requestBody.isFromUser;
        }

        // Only update moderation status if explicitly provided and no content change
        if (
          requestBody.moderationStatus !== undefined &&
          requestBody.moderationStatus !== existingNote.moderationStatus &&
          requestBody.note === existingNote.note
        ) {
          updates.moderationStatus = requestBody.moderationStatus;
        }

        // If moderation details provided and content hasn't changed
        if (
          requestBody.moderationDetails !== undefined &&
          requestBody.note === existingNote.note
        ) {
          updates.moderationDetails = requestBody.moderationDetails;
        }

        // Apply updates
        const updatedNote = await updateNote(
          tableName,
          requestBody.recommendationId,
          requestBody.noteId,
          updates
        );

        utils.metrics.addMetric('NoteUpdateCount', MetricUnit.Count, 1);

        utils.logger.info('Successfully updated note', {
          recommendationId: updatedNote.recommendationId,
          noteId: updatedNote.noteId,
          updates: Object.keys(updates),
        });

        return utils.createSuccessResponse(event, {
          message: 'Note updated successfully.',
          note: updatedNote,
        });
      }

      // Create a new note
      const noteId = requestBody.noteId || generateUUID();
      utils.logger.info('Creating new note', {
        recommendationId: requestBody.recommendationId,
        noteId,
      });

      // Set initial moderation status and details
      let moderationStatus: ModerationStatus = 'PENDING_REVIEW';
      let moderationDetails: any = undefined;

      // Check content with moderation service
      try {
        const moderationResult = await checkModeration(requestBody.note);
        utils.logger.info('Moderation check completed', { moderationResult });

        if (moderationResult.flagged) {
          moderationStatus = 'PENDING_REVIEW';
          moderationDetails = {
            flaggedCategories: moderationResult.flags,
            flaggedTimestamp: new Date().toISOString(),
          };

          utils.logger.info('Content flagged by moderation', {
            recommendationId: requestBody.recommendationId,
            noteId,
            flags: moderationResult.flags,
          });
        } else {
          // If not flagged, we can auto-approve if that's the desired behavior
          moderationStatus = 'APPROVED';
          utils.logger.info('Content passed moderation check', {
            recommendationId: requestBody.recommendationId,
            noteId,
          });
        }
      } catch (error) {
        utils.logger.warn('Moderation check failed, using default status', {
          error,
        });
        // Keep default status for fallback
      }

      // Create the note object
      const newNote: RecommendationNote = {
        recommendationId: requestBody.recommendationId,
        noteId,
        from: requestBody.from || 'anonymous',
        note: requestBody.note,
        isFromUser: requestBody.isFromUser || false,
        noteTimestamp: new Date().toISOString(),
        moderationStatus: requestBody.moderationStatus || moderationStatus,
        moderationDetails: requestBody.moderationDetails || moderationDetails,
      };

      // Store in DynamoDB
      const result = await createNote(tableName, newNote);

      utils.metrics.addMetric('NoteCreateCount', MetricUnit.Count, 1);

      utils.logger.info('Successfully created note', {
        recommendationId: result.recommendationId,
        noteId: result.noteId,
      });

      return utils.createSuccessResponse(event, {
        message: 'Note created successfully.',
        note: result,
      });
    } catch (error) {
      utils.logger.error('Error processing note', { error });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to process note'
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
 * Create a new note
 */
async function createNote(
  tableName: string,
  note: RecommendationNote
): Promise<RecommendationNote> {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

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
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

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
