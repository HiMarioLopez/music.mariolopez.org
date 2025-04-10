import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import {
  createRecommendation,
  getRecommendation,
  updateRecommendation,
  getRecommendationById,
} from '../../../services/dynamodb/recommendations';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';
import {
  AlbumRecommendation,
  ArtistRecommendation,
  EntityType,
  Recommendation,
  SongRecommendation,
  UserInteractionStatus,
} from '../../../models/recommendation';

const logger = new Logger({ serviceName: 'set-recommendations' });
const tracer = new Tracer({ serviceName: 'set-recommendations' });
const metrics = new Metrics({ namespace: 'set-recommendations' });

/**
 * API Gateway handler function to create or update a recommendation
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

  logger.info('Set Recommendation Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_TABLE_NAME_PARAMETER'
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

    // Check if we're updating an existing recommendation by ID
    if (requestBody.recommendationId) {
      logger.info('Updating recommendation by ID', {
        recommendationId: requestBody.recommendationId,
      });

      // Get the existing recommendation
      const existingRecommendation = await getRecommendationById(
        tableName,
        requestBody.recommendationId
      );

      if (!existingRecommendation) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
          body: JSON.stringify({
            message: `Recommendation with ID ${requestBody.recommendationId} not found`,
          }),
        };
      }

      // Prepare updates
      const updates: {
        voteChange?: number;
        userInteractionStatus?: UserInteractionStatus;
        reviewedByUser?: boolean;
      } = {};

      // Handle vote change
      if (requestBody.voteChange !== undefined) {
        updates.voteChange = Number(requestBody.voteChange);
      }

      // Handle user status
      if (requestBody.userInteractionStatus) {
        if (
          !['LIKED', 'DISLIKED', 'DISMISSED'].includes(
            requestBody.userInteractionStatus
          )
        ) {
          return {
            statusCode: 400,
            headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
            body: JSON.stringify({
              message:
                'userInteractionStatus must be one of: LIKED, DISLIKED, or DISMISSED',
            }),
          };
        }
        updates.userInteractionStatus =
          requestBody.userInteractionStatus as UserInteractionStatus;
      }

      // Handle reviewedByUser
      if (requestBody.reviewedByUser !== undefined) {
        updates.reviewedByUser = Boolean(requestBody.reviewedByUser);
      }

      // Update the recommendation
      const result = await updateRecommendation(
        tableName,
        existingRecommendation,
        updates
      );

      metrics.addMetric(
        `${existingRecommendation.entityType}RecommendationUpdateCount`,
        MetricUnit.Count,
        1
      );

      logger.info('Successfully updated recommendation by ID', {
        recommendationId: result.recommendationId,
        entityType: result.entityType,
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Recommendation updated successfully.',
          recommendation: result,
        }),
      };
    }

    // Validate request body for new recommendation
    if (!requestBody.entityType) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message:
            'entityType is required in request body (SONG, ALBUM, or ARTIST)',
        }),
      };
    }

    // Validate the type is one of the allowed values
    if (!['SONG', 'ALBUM', 'ARTIST'].includes(requestBody.entityType)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'entityType must be one of: SONG, ALBUM, or ARTIST',
        }),
      };
    }

    // Validate required fields based on type
    if (requestBody.entityType === 'SONG') {
      if (
        !requestBody.songTitle ||
        !requestBody.artistName ||
        !requestBody.albumName
      ) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
          body: JSON.stringify({
            message:
              'For SONG recommendations, songTitle, artistName, and albumName are required',
          }),
        };
      }
    } else if (requestBody.entityType === 'ALBUM') {
      if (!requestBody.albumTitle || !requestBody.artistName) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
          body: JSON.stringify({
            message:
              'For ALBUM recommendations, albumTitle and artistName are required',
          }),
        };
      }
    } else if (requestBody.entityType === 'ARTIST') {
      if (!requestBody.artistName) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
          body: JSON.stringify({
            message: 'For ARTIST recommendations, artistName is required',
          }),
        };
      }
    }

    // Extract vote change if specified
    const voteChange =
      requestBody.voteChange !== undefined
        ? Number(requestBody.voteChange)
        : undefined;

    logger.info('Processing recommendation request', {
      voteChange: voteChange,
    });

    // Check if the recommendation already exists
    const searchAttributes = {
      artistName: requestBody.artistName,
      songTitle:
        requestBody.entityType === 'SONG' ? requestBody.songTitle : undefined,
      albumName:
        requestBody.entityType === 'SONG' ? requestBody.albumName : undefined,
      albumTitle:
        requestBody.entityType === 'ALBUM' ? requestBody.albumTitle : undefined,
    };

    const existingRecommendation = await getRecommendation(
      tableName,
      requestBody.entityType as EntityType,
      searchAttributes
    );

    let result: Recommendation;

    // If recommendation exists, update it; otherwise create a new one
    if (existingRecommendation) {
      logger.info('Found existing recommendation, updating', {
        entityType: requestBody.entityType,
        recommendationId: existingRecommendation.recommendationId,
      });

      // Prepare updates
      const updates: {
        voteChange?: number;
        userInteractionStatus?: UserInteractionStatus;
        reviewedByUser?: boolean;
      } = {};

      // Handle vote change
      // If voteChange is explicitly provided, use it
      if (voteChange !== undefined) {
        updates.voteChange = voteChange;
      }

      // Handle user status if provided
      if (requestBody.userInteractionStatus) {
        if (
          !['LIKED', 'DISLIKED', 'DISMISSED'].includes(
            requestBody.userInteractionStatus
          )
        ) {
          return {
            statusCode: 400,
            headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
            body: JSON.stringify({
              message:
                'userInteractionStatus must be one of: LIKED, DISLIKED, or DISMISSED',
            }),
          };
        }
        updates.userInteractionStatus =
          requestBody.userInteractionStatus as UserInteractionStatus;
      }

      // Handle reviewedByUser if provided
      if (requestBody.reviewedByUser !== undefined) {
        updates.reviewedByUser = Boolean(requestBody.reviewedByUser);
      }

      // Update the recommendation
      result = await updateRecommendation(
        tableName,
        existingRecommendation,
        updates
      );

      metrics.addMetric(
        `${requestBody.entityType}RecommendationUpdateCount`,
        MetricUnit.Count,
        1
      );
    } else {
      // Create a new recommendation
      logger.info('Creating new recommendation', {
        entityType: requestBody.entityType,
      });

      // Map the request body to the corresponding recommendation type
      let newRecommendation: Omit<
        Recommendation,
        'createdAt' | 'votes' | 'recommendationId' | 'reviewedByUser'
      >;

      if (requestBody.entityType === 'SONG') {
        newRecommendation = {
          entityType: 'SONG',
          songTitle: requestBody.songTitle,
          artistName: requestBody.artistName,
          albumName: requestBody.albumName,
          albumCoverUrl: requestBody.albumCoverUrl || '',
        } as Omit<
          SongRecommendation,
          'createdAt' | 'votes' | 'recommendationId' | 'reviewedByUser'
        >;
      } else if (requestBody.entityType === 'ALBUM') {
        newRecommendation = {
          entityType: 'ALBUM',
          albumTitle: requestBody.albumTitle,
          artistName: requestBody.artistName,
          albumCoverUrl: requestBody.albumCoverUrl || '',
          trackCount: requestBody.trackCount,
          releaseDate: requestBody.releaseDate,
        } as Omit<
          AlbumRecommendation,
          'createdAt' | 'votes' | 'recommendationId' | 'reviewedByUser'
        >;
      } else {
        newRecommendation = {
          entityType: 'ARTIST',
          artistName: requestBody.artistName,
          artistImageUrl: requestBody.artistImageUrl || '',
          genres: requestBody.genres,
        } as Omit<
          ArtistRecommendation,
          'createdAt' | 'votes' | 'recommendationId' | 'reviewedByUser'
        >;
      }

      // Store in DynamoDB
      result = await createRecommendation(tableName, newRecommendation);

      metrics.addMetric(
        `${requestBody.entityType}RecommendationCreateCount`,
        MetricUnit.Count,
        1
      );
    }

    logger.info('Successfully processed recommendation', {
      entityType: requestBody.entityType,
      recommendationId: result.recommendationId,
      isNewRecord: !existingRecommendation,
    });

    // Return success response with the created or updated recommendation
    const operation = existingRecommendation ? 'updated' : 'created';

    logger.info('Returning response', {
      operation,
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: `Recommendation ${operation} successfully.`,
        recommendation: result,
      }),
    };
  } catch (error) {
    logger.error('Error processing recommendation', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to process recommendation',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
