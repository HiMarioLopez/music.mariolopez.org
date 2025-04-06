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
import { checkModeration } from '../../../services/openai/moderation';

const logger = new Logger({ serviceName: 'set-recommendation-review' });
const tracer = new Tracer({ serviceName: 'set-recommendation-review' });
const metrics = new Metrics({ namespace: 'set-recommendation-review' });

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * API Gateway handler function to create or update a recommendation review
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

  logger.info('Set Recommendation Review Lambda invoked', { event });
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

    // Check if we're updating an existing review by ID
    if (requestBody.noteId) {
      logger.info('Updating review by ID', {
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
        return {
          statusCode: 404,
          headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
          body: JSON.stringify({
            message: `Review with ID ${requestBody.noteId} for recommendation ${requestBody.recommendationId} not found`,
          }),
        };
      }

      // Prepare updates
      const updates: Partial<RecommendationNote> = {};

      // Handle note content update
      if (requestBody.note) {
        updates.note = requestBody.note;

        // Check content moderation for updated note
        logger.info('Checking content moderation for updated review', {
          recommendationId: requestBody.recommendationId,
          noteId: requestBody.noteId,
        });

        const moderationResult = await checkModeration(requestBody.note);

        if (moderationResult.flagged) {
          // If content is flagged, update moderation status and details
          updates.moderationStatus = 'PENDING_REVIEW';
          updates.moderationDetails = {
            ...existingReview.moderationDetails,
            flaggedCategories: moderationResult.flags,
            flaggedTimestamp: new Date().toISOString(),
          };

          logger.info('Updated content flagged by moderation', {
            recommendationId: requestBody.recommendationId,
            noteId: requestBody.noteId,
            flags: moderationResult.flags,
          });
        } else if (!requestBody.moderationStatus) {
          // If not flagged and no explicit moderation status provided, auto-approve
          updates.moderationStatus = 'APPROVED';
          logger.info('Updated content passed moderation check', {
            recommendationId: requestBody.recommendationId,
            noteId: requestBody.noteId,
          });
        }
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
          ...existingReview.moderationDetails,
          ...requestBody.moderationDetails,
        };
      }

      // Update the review
      const result = await updateReview(
        tableName,
        requestBody.recommendationId,
        requestBody.noteId,
        updates
      );

      metrics.addMetric('ReviewUpdateCount', MetricUnit.Count, 1);

      logger.info('Successfully updated review by ID', {
        recommendationId: result.recommendationId,
        noteId: result.noteId,
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Review updated successfully.',
          review: result,
        }),
      };
    }

    // Create a new review
    logger.info('Creating new review', {
      recommendationId: requestBody.recommendationId,
    });

    // Generate a new note ID
    const noteId = generateUUID();

    // Check content moderation
    logger.info('Checking content moderation', {
      recommendationId: requestBody.recommendationId,
      noteId,
    });

    const moderationResult = await checkModeration(requestBody.note);

    // Determine moderation status based on the check result
    let moderationStatus: ModerationStatus = 'PENDING_REVIEW';
    let moderationDetails: RecommendationNote['moderationDetails'] = {};

    if (moderationResult.flagged) {
      moderationStatus = 'PENDING_REVIEW';
      moderationDetails = {
        flaggedCategories: moderationResult.flags,
        flaggedTimestamp: new Date().toISOString(),
      };

      logger.info('Content flagged by moderation', {
        recommendationId: requestBody.recommendationId,
        noteId,
        flags: moderationResult.flags,
      });
    } else {
      // If not flagged, we can auto-approve if that's the desired behavior
      moderationStatus = 'APPROVED';
      logger.info('Content passed moderation check', {
        recommendationId: requestBody.recommendationId,
        noteId,
      });
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

    metrics.addMetric('ReviewCreateCount', MetricUnit.Count, 1);

    logger.info('Successfully created review', {
      recommendationId: result.recommendationId,
      noteId: result.noteId,
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Review created successfully.',
        review: result,
      }),
    };
  } catch (error) {
    logger.error('Error processing review', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to process review',
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
 * Create a new review
 */
async function createReview(
  tableName: string,
  review: RecommendationNote
): Promise<RecommendationNote> {
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
