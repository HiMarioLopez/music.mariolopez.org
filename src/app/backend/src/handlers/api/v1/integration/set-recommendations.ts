import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import {
  AlbumRecommendation,
  ArtistRecommendation,
  EntityType,
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
import { generateRecommendationId } from '@utils/uuid';
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * API Gateway handler function to create or update a recommendation
 */
export const handler = wrapHandler(
  {
    serviceName: 'set-recommendations',
  },
  async (event, context, utils): Promise<APIGatewayProxyResult> => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.WRITE,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    const tableName = await utils.getRequiredParameter(
      utils.getRequiredEnvVar('DYNAMODB_TABLE_NAME_PARAMETER')
    );

    if (!event.body) {
      return utils.createErrorResponse(
        event,
        new Error('Request body is required'),
        HttpStatus.BAD_REQUEST,
        'Request body is required'
      );
    }

    const requestBody = JSON.parse(event.body);

    utils.logger.info('Request body parsed', {
      requestBody: JSON.stringify(requestBody),
    });

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

    let idFields: {
      entityType: EntityType;
      artistName: string;
      songTitle?: string;
      albumTitle?: string;
    } = {
      entityType: requestBody.entityType,
      artistName: '',
    };

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
      idFields.artistName = requestBody.artistName;
      idFields.songTitle = requestBody.songTitle;
    } else if (requestBody.entityType === 'ALBUM') {
      if (!requestBody.albumTitle || !requestBody.artistName) {
        return utils.createErrorResponse(
          event,
          new Error('Missing required fields for album recommendation'),
          HttpStatus.BAD_REQUEST,
          'albumTitle and artistName are required for album recommendations'
        );
      }
      idFields.artistName = requestBody.artistName;
      idFields.albumTitle = requestBody.albumTitle;
    } else if (requestBody.entityType === 'ARTIST') {
      if (!requestBody.artistName) {
        return utils.createErrorResponse(
          event,
          new Error('Missing required fields for artist recommendation'),
          HttpStatus.BAD_REQUEST,
          'artistName is required for artist recommendations'
        );
      }
      idFields.artistName = requestBody.artistName;
    }

    const recommendationId = generateRecommendationId(
      idFields.entityType,
      idFields.artistName,
      idFields.songTitle,
      idFields.albumTitle
    );
    utils.logger.info('Generated deterministic recommendation ID', {
      recommendationId,
    });

    const existingRecommendation = await getRecommendationById(
      tableName,
      recommendationId
    );

    let result: Recommendation;
    let operation: 'created' | 'updated' | 'merged';

    if (existingRecommendation) {
      utils.logger.info('Found existing recommendation, updating votes...', {
        recommendationId,
      });

      const updates: {
        voteChange?: number;
        userInteractionStatus?: UserInteractionStatus;
        reviewedByUser?: boolean;
      } = {};

      updates.voteChange = 1;

      result = await updateRecommendation(
        tableName,
        existingRecommendation,
        updates
      );
      operation = 'merged';

      utils.metrics.addMetric(
        `${result.entityType}RecommendationUpdateCount`,
        MetricUnit.Count,
        1
      );
    } else {
      utils.logger.info(
        'No existing recommendation found, creating new one...',
        {
          recommendationId,
          entityType: requestBody.entityType,
        }
      );

      let newRecommendationData: Omit<
        Recommendation,
        'createdAt' | 'votes' | 'recommendationId' | 'reviewedByUser'
      >;

      if (requestBody.entityType === 'SONG') {
        newRecommendationData = {
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
        newRecommendationData = {
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
        newRecommendationData = {
          entityType: 'ARTIST',
          artistName: requestBody.artistName,
          artistImageUrl: requestBody.artistImageUrl || '',
          genres: requestBody.genres,
        } as Omit<
          ArtistRecommendation,
          'createdAt' | 'votes' | 'recommendationId' | 'reviewedByUser'
        >;
      }

      result = await createRecommendation(tableName, newRecommendationData);
      operation = 'created';

      utils.metrics.addMetric(
        `${result.entityType}RecommendationCreateCount`,
        MetricUnit.Count,
        1
      );
    }

    utils.logger.info('Successfully processed recommendation', {
      entityType: result.entityType,
      recommendationId: result.recommendationId,
      operation,
      finalVotes: result.votes,
    });

    return utils.createSuccessResponse(event, {
      message: `Recommendation ${operation} successfully.`,
      recommendation: result,
      operation,
    });
  }
);
