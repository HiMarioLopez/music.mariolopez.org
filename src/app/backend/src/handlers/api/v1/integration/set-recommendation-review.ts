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
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * API Gateway handler function to create or update a recommendation review
 * Reviews are notes with isFromUser=true
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'set-recommendation-review' },
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

      // Check if we're updating an existing review by ID
      if (requestBody.noteId) {
        utils.logger.info('Updating review by ID', {
          recommendationId: requestBody.recommendationId,
          noteId: requestBody.noteId,
        });

        // Get the existing review
        const existingReview = await getReviewById(
          tableName,
          requestBody.recommendationId,
          requestBody.noteId
        );

        if (!existingReview) {
          return utils.createErrorResponse(
            event,
            new Error(`Review with ID ${requestBody.noteId} not found`),
            HttpStatus.NOT_FOUND,
            `Review with ID ${requestBody.noteId} for recommendation ${requestBody.recommendationId} not found`
          );
        }

        // Prepare updates
        const updates: Partial<RecommendationNote> = {};

        // Handle review content update
        if (requestBody.note !== existingReview.note) {
          updates.note = requestBody.note;

          // Update timestamp
          updates.noteTimestamp = new Date().toISOString();

          // Reset moderation status if content changes
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
          requestBody.from !== existingReview.from
        ) {
          updates.from = requestBody.from;
        }

        // Only update moderation status if explicitly provided and no content change
        if (
          requestBody.moderationStatus !== undefined &&
          requestBody.moderationStatus !== existingReview.moderationStatus &&
          requestBody.note === existingReview.note
        ) {
          updates.moderationStatus = requestBody.moderationStatus;
        }

        // If moderation details provided and content hasn't changed
        if (
          requestBody.moderationDetails !== undefined &&
          requestBody.note === existingReview.note
        ) {
          updates.moderationDetails = requestBody.moderationDetails;
        }

        // Apply updates
        const updatedReview = await updateReview(
          tableName,
          requestBody.recommendationId,
          requestBody.noteId,
          updates
        );

        utils.metrics.addMetric('ReviewUpdateCount', MetricUnit.Count, 1);

        utils.logger.info('Successfully updated review', {
          recommendationId: updatedReview.recommendationId,
          noteId: updatedReview.noteId,
          updates: Object.keys(updates),
        });

        return utils.createSuccessResponse(event, {
          message: 'Review updated successfully.',
          review: updatedReview,
        });
      }

      // Create a new review
      const noteId = requestBody.noteId || generateUUID();
      utils.logger.info('Creating new review', {
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

      // Create the review object
      const newReview: RecommendationNote = {
        recommendationId: requestBody.recommendationId,
        noteId,
        from: requestBody.from || 'Mario', // Default to Mario for reviews
        note: requestBody.note,
        isFromUser: true, // Always true for reviews
        noteTimestamp: new Date().toISOString(),
        moderationStatus: requestBody.moderationStatus || moderationStatus,
        moderationDetails: requestBody.moderationDetails || moderationDetails,
      };

      // Store in DynamoDB
      const result = await createReview(tableName, newReview);

      utils.metrics.addMetric('ReviewCreateCount', MetricUnit.Count, 1);

      utils.logger.info('Successfully created review', {
        recommendationId: result.recommendationId,
        noteId: result.noteId,
      });

      return utils.createSuccessResponse(event, {
        message: 'Review created successfully.',
        review: result,
      });
    } catch (error) {
      utils.logger.error('Error processing review', { error });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to process review'
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
 * Create a new review
 */
async function createReview(
  tableName: string,
  review: RecommendationNote
): Promise<RecommendationNote> {
  const ddbClient = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const command = new PutCommand({
    TableName: tableName,
    Item: review,
  });

  await ddbDocClient.send(command);
  return review;
}

/**
 * Update an existing review
 */
async function updateReview(
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

  // If no updates, return the existing review
  if (updateExpressionParts.length === 0) {
    return getReviewById(
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
