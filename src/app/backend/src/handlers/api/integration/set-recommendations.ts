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
  Recommendation,
  SongRecommendation,
  AlbumRecommendation,
  ArtistRecommendation,
} from '../../../services/dynamodb/recommendations';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'set-recommendations' });
const tracer = new Tracer({ serviceName: 'set-recommendations' });
const metrics = new Metrics({ namespace: 'set-recommendations' });

/**
 * API Gateway handler function to create a new recommendation
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
      hasNotes: !!requestBody.notes,
      notesType: requestBody.notes ? typeof requestBody.notes : 'undefined',
      notesIsArray: requestBody.notes
        ? Array.isArray(requestBody.notes)
        : false,
      notesLength: requestBody.notes ? requestBody.notes.length : 0,
    });

    // Validate request body
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

    // Create the recommendation in DynamoDB
    logger.info('Creating recommendation', {
      entityType: requestBody.entityType,
    });

    // Map the request body to the corresponding recommendation type
    let recommendation: Omit<Recommendation, 'timestamp'>;

    // Use notes array from request body if it exists
    const notes = requestBody.notes ? requestBody.notes : undefined;

    logger.info('Notes being used for recommendation', {
      notesSource: requestBody.notes ? 'from request body notes array' : 'none',
      notesCount: notes?.length || 0,
    });

    if (requestBody.entityType === 'SONG') {
      recommendation = {
        entityType: 'SONG',
        songTitle: requestBody.songTitle,
        artistName: requestBody.artistName,
        albumName: requestBody.albumName,
        albumCoverUrl: requestBody.albumCoverUrl || '',
        notes,
      } as SongRecommendation;
    } else if (requestBody.entityType === 'ALBUM') {
      recommendation = {
        entityType: 'ALBUM',
        albumTitle: requestBody.albumTitle,
        artistName: requestBody.artistName,
        albumCoverUrl: requestBody.albumCoverUrl || '',
        trackCount: requestBody.trackCount,
        releaseDate: requestBody.releaseDate,
        notes,
      } as AlbumRecommendation;
    } else {
      recommendation = {
        entityType: 'ARTIST',
        artistName: requestBody.artistName,
        artistImageUrl: requestBody.artistImageUrl || '',
        genres: requestBody.genres,
        notes,
      } as ArtistRecommendation;
    }

    // Store in DynamoDB
    const result = await createRecommendation(tableName, recommendation);

    // Record metrics based on recommendation type
    metrics.addMetric(
      `${requestBody.entityType}RecommendationCount`,
      MetricUnit.Count,
      1
    );

    logger.info('Successfully created recommendation', {
      entityType: requestBody.entityType,
      timestamp: result.timestamp,
    });

    // Return success response with the created recommendation
    return {
      statusCode: 201,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Recommendation created successfully',
        recommendation: result,
      }),
    };
  } catch (error) {
    logger.error('Error creating recommendation', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to create recommendation',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
