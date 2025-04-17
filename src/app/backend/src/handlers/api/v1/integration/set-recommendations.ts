import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import {
  AlbumRecommendation,
  ArtistRecommendation,
  Recommendation,
  SongRecommendation,
  UserInteractionStatus,
} from '@models/recommendation';
import {
  createRecommendation,
  getRecommendationById,
  updateRecommendation,
} from '@services/dynamodb/recommendations';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * API Gateway handler function to create or update a recommendation
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'set-recommendations' },
  async (event, context, utils) => {
    // Implement rate limiting for write operations
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.WRITE,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    // Get DynamoDB table name from Parameter Store
    const tableNameParameter = utils.getRequiredEnvVar(
      'DYNAMODB_TABLE_NAME_PARAMETER'
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

    let result;
    let existingRecommendation;

    // Check if we're updating an existing recommendation by ID
    if (requestBody.recommendationId) {
      utils.logger.info('Updating recommendation by ID', {
        recommendationId: requestBody.recommendationId,
      });

      // Get the existing recommendation
      existingRecommendation = await getRecommendationById(
        tableName,
        requestBody.recommendationId
      );

      if (!existingRecommendation) {
        return utils.createErrorResponse(
          event,
          new Error(
            `Recommendation with ID ${requestBody.recommendationId} not found`
          ),
          HttpStatus.NOT_FOUND,
          `Recommendation with ID ${requestBody.recommendationId} not found`
        );
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
          return utils.createErrorResponse(
            event,
            new Error('Invalid userInteractionStatus'),
            HttpStatus.BAD_REQUEST,
            'userInteractionStatus must be one of: LIKED, DISLIKED, or DISMISSED'
          );
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

      utils.metrics.addMetric(
        `${requestBody.entityType}RecommendationUpdateCount`,
        MetricUnit.Count,
        1
      );
    } else {
      // Validate required fields for new recommendations
      if (!requestBody.entityType) {
        return utils.createErrorResponse(
          event,
          new Error('entityType is required'),
          HttpStatus.BAD_REQUEST,
          'entityType is required in request body'
        );
      }

      if (!['SONG', 'ALBUM', 'ARTIST'].includes(requestBody.entityType)) {
        return utils.createErrorResponse(
          event,
          new Error('Invalid entityType'),
          HttpStatus.BAD_REQUEST,
          'entityType must be one of: SONG, ALBUM, or ARTIST'
        );
      }

      // Create a new recommendation
      utils.logger.info('Creating new recommendation', {
        entityType: requestBody.entityType,
      });

      // Validate entity-specific required fields
      if (requestBody.entityType === 'SONG') {
        if (
          !requestBody.songTitle ||
          !requestBody.artistName ||
          !requestBody.albumName
        ) {
          return utils.createErrorResponse(
            event,
            new Error('Missing required fields for song recommendation'),
            HttpStatus.BAD_REQUEST,
            'songTitle, artistName, and albumName are required for song recommendations'
          );
        }
      } else if (requestBody.entityType === 'ALBUM') {
        if (!requestBody.albumTitle || !requestBody.artistName) {
          return utils.createErrorResponse(
            event,
            new Error('Missing required fields for album recommendation'),
            HttpStatus.BAD_REQUEST,
            'albumTitle and artistName are required for album recommendations'
          );
        }
      } else if (requestBody.entityType === 'ARTIST') {
        if (!requestBody.artistName) {
          return utils.createErrorResponse(
            event,
            new Error('Missing required fields for artist recommendation'),
            HttpStatus.BAD_REQUEST,
            'artistName is required for artist recommendations'
          );
        }
      }

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

      utils.metrics.addMetric(
        `${requestBody.entityType}RecommendationCreateCount`,
        MetricUnit.Count,
        1
      );
    }

    utils.logger.info('Successfully processed recommendation', {
      entityType: requestBody.entityType,
      recommendationId: result.recommendationId,
      isNewRecord: !existingRecommendation,
    });

    // Return success response with the created or updated recommendation
    const operation = existingRecommendation ? 'updated' : 'created';

    utils.logger.info('Returning response', {
      operation,
    });

    return utils.createSuccessResponse(event, {
      message: `Recommendation ${operation} successfully.`,
      recommendation: result,
    });
  }
);
