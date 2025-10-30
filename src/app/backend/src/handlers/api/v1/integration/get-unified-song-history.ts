import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { getAllSongs, getSongsByArtist } from '@services/dynamodb/song-history';
import { wrapHandler } from '@utils/lambda-handler';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { isAppleMusicSong, isSpotifySong } from '../../../../models/song';

// Default limit for queries
const DEFAULT_LIMIT = 50;

/**
 * API Gateway handler function to fetch unified music history from both Apple Music and Spotify
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-unified-song-history' },
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

      // Get filters
      const artistName = queryParams.artist;
      const source = queryParams.source as
        | 'apple'
        | 'spotify'
        | 'all'
        | undefined;

      utils.logger.info('Fetching unified song history', {
        artistName,
        source,
        limit,
      });

      // Fetch songs from DynamoDB
      let result;
      if (artistName) {
        utils.logger.info('Fetching songs by artist', { artistName, limit });
        result = await getSongsByArtist(tableName, artistName, limit, startKey);
        utils.metrics.addMetric('ArtistFilteredQuery', MetricUnit.Count, 1);
      } else {
        utils.logger.info('Fetching all songs', { limit });
        result = await getAllSongs(tableName, limit, startKey);
        utils.metrics.addMetric('AllSongsQuery', MetricUnit.Count, 1);
      }

      // Filter by source if specified
      let filteredItems = result.items;
      if (source && source !== 'all') {
        filteredItems = result.items.filter((song) => {
          if (source === 'apple') {
            return isAppleMusicSong(song);
          } else if (source === 'spotify') {
            return isSpotifySong(song);
          }
          return true;
        });

        utils.logger.info('Filtered songs by source', {
          source,
          originalCount: result.items.length,
          filteredCount: filteredItems.length,
        });

        utils.metrics.addMetric('SourceFilteredQuery', MetricUnit.Count, 1);
      }

      // Add source information to each song for frontend
      const songsWithSource = filteredItems.map((song) => ({
        ...song,
        // Ensure source field is present (for backwards compatibility)
        source: song.source || (isAppleMusicSong(song) ? 'apple' : 'spotify'),
      }));

      // Count songs by source
      const sourceCounts = songsWithSource.reduce(
        (acc, song) => {
          const songSource = song.source || 'unknown';
          acc[songSource] = (acc[songSource] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Record metrics
      utils.metrics.addMetric(
        'UnifiedResultCount',
        MetricUnit.Count,
        songsWithSource.length
      );

      Object.entries(sourceCounts).forEach(([src, count]) => {
        utils.metrics.addMetric(
          `SongsBySource_${src}`,
          MetricUnit.Count,
          count as number
        );
      });

      // Format the paginated response using our utility
      const response = utils.formatPaginatedResponse(
        songsWithSource,
        result.lastEvaluatedKey
      );

      utils.logger.info('Successfully returned unified song history', {
        count: songsWithSource.length,
        hasMore: !!result.lastEvaluatedKey,
        sourceBreakdown: sourceCounts,
      });

      // Return songs as JSON response with source information
      return utils.createSuccessResponse(event, {
        ...response,
        sourceBreakdown: sourceCounts,
        totalSources: Object.keys(sourceCounts).length,
      });
    } catch (error) {
      utils.logger.error('Error fetching unified music history', { error });
      utils.metrics.addMetric('UnifiedQueryError', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to fetch unified music history'
      );
    }
  }
);
