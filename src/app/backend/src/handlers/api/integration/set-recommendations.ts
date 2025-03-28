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

    // Get the table name from SSM Parameter Store
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

    // Validate request body
    if (!requestBody.type) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'type is required in request body (SONG, ALBUM, or ARTIST)',
        }),
      };
    }

    // Validate the type is one of the allowed values
    if (!['SONG', 'ALBUM', 'ARTIST'].includes(requestBody.type)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'type must be one of: SONG, ALBUM, or ARTIST',
        }),
      };
    }

    // Validate required fields based on type
    if (requestBody.type === 'SONG') {
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
    } else if (requestBody.type === 'ALBUM') {
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
    } else if (requestBody.type === 'ARTIST') {
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
    logger.info('Creating recommendation', { type: requestBody.type });

    // Map the request body to the corresponding recommendation type
    let recommendation: Omit<Recommendation, 'entityType' | 'timestamp'>;
    if (requestBody.type === 'SONG') {
      recommendation = {
        type: 'SONG',
        songTitle: requestBody.songTitle,
        artistName: requestBody.artistName,
        albumName: requestBody.albumName,
        albumCoverUrl: requestBody.albumCoverUrl || '',
        from: requestBody.from,
        note: requestBody.note,
      } as SongRecommendation;
    } else if (requestBody.type === 'ALBUM') {
      recommendation = {
        type: 'ALBUM',
        albumTitle: requestBody.albumTitle,
        artistName: requestBody.artistName,
        albumCoverUrl: requestBody.albumCoverUrl || '',
        trackCount: requestBody.trackCount,
        releaseDate: requestBody.releaseDate,
        from: requestBody.from,
        note: requestBody.note,
      } as AlbumRecommendation;
    } else {
      recommendation = {
        type: 'ARTIST',
        artistName: requestBody.artistName,
        artistImageUrl: requestBody.artistImageUrl || '',
        genres: requestBody.genres,
        from: requestBody.from,
        note: requestBody.note,
      } as ArtistRecommendation;
    }

    // Store in DynamoDB
    const result = await createRecommendation(tableName, recommendation);

    // Track metrics based on recommendation type
    metrics.addMetric(
      `${requestBody.type}RecommendationCount`,
      MetricUnit.Count,
      1
    );

    logger.info('Successfully created recommendation', {
      type: requestBody.type,
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
