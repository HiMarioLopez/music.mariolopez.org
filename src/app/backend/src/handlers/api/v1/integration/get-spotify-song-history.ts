import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { getAllSongs, getSongsByArtist } from '@services/dynamodb/song-history';
import { wrapHandler } from '@utils/lambda-handler';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Default limit for queries
const DEFAULT_LIMIT = 10;

/**
 * API Gateway handler function to fetch Spotify music history
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-spotify-song-history' },
  async (event, context, utils) => {
    try {
      // Get required environment variables
      const tableNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_TABLE_NAME_PARAMETER'
      );

      // Get the table name from SSM Parameter Store
      const tableName = await utils.getRequiredParameter(tableNameParameter);

      // Get query parameters and parse pagination
      const { queryParams, limit, startKey } = utils.parseQueryParams(
        event,
        DEFAULT_LIMIT
      );

      // Get artist filter if provided
      const artistName = queryParams.artist;

      // Fetch songs from DynamoDB
      let result;
      if (artistName) {
        utils.logger.info('Fetching Spotify songs by artist', { artistName, limit });
        result = await getSongsByArtist(tableName, artistName, limit, startKey);
        utils.metrics.addMetric('ArtistFilteredQuery', MetricUnit.Count, 1);
      } else {
        utils.logger.info('Fetching all Spotify songs', { limit });
        result = await getAllSongs(tableName, limit, startKey);
        utils.metrics.addMetric('AllSongsQuery', MetricUnit.Count, 1);
      }

      // Record the number of results returned
      utils.metrics.addMetric(
        'ResultCount',
        MetricUnit.Count,
        result.items.length
      );

      // Format the paginated response using our utility
      const response = utils.formatPaginatedResponse(
        result.items,
        result.lastEvaluatedKey
      );

      utils.logger.info('Successfully returned Spotify song history', {
        count: result.items.length,
        hasMore: !!result.lastEvaluatedKey,
      });

      // Return songs as JSON response
      return utils.createSuccessResponse(event, response);
    } catch (error) {
      utils.logger.error('Error fetching Spotify music history', { error });
      utils.metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to fetch Spotify music history'
      );
    }
  }
);

