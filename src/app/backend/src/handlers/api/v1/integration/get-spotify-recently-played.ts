import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { storeSongsInDynamoDB } from '@services/dynamodb/song-storage';
import { fetchRecentlyPlayedTracks, processSongs } from '@services/spotify';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * API Gateway handler function to fetch recently played Spotify tracks
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'get-spotify-recently-played' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.EXTERNAL_API,
      logger: utils.logger,
      metrics: utils.metrics,
    });
    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    try {
      // Get required environment variables
      const tableNameParameter = utils.getRequiredEnvVar(
        'DYNAMODB_TABLE_NAME_PARAMETER'
      );
      const songLimitParameter = utils.getRequiredEnvVar(
        'SPOTIFY_SONG_LIMIT_PARAMETER'
      );

      // Get the table name from SSM Parameter Store
      const tableName = await utils.getRequiredParameter(tableNameParameter);

      // Get song limit from SSM
      const songLimitParam =
        await utils.getRequiredParameter(songLimitParameter);
      const songLimit = parseInt(songLimitParam, 10);

      // Get query parameters
      const { queryParams } = utils.parseQueryParams(event, 25);
      const limit = Math.min(
        queryParams.limit ? parseInt(queryParams.limit, 10) : songLimit,
        50
      );

      // Get last processed song ID for incremental updates
      const lastProcessedSongId = queryParams.lastProcessedSongId;

      utils.logger.info('Fetching recently played Spotify tracks', {
        limit,
        lastProcessedSongId,
      });

      // Fetch recently played tracks from Spotify
      const allSongs = await fetchRecentlyPlayedTracks(limit);

      if (allSongs.length === 0) {
        utils.logger.info('No recently played tracks found on Spotify');
        return utils.createSuccessResponse(event, {
          songs: [],
          count: 0,
          source: 'spotify',
        });
      }

      // Process songs to filter out already processed ones
      const newSongs = await processSongs(allSongs, lastProcessedSongId || '');

      // Store new songs in DynamoDB if any
      if (newSongs.length > 0) {
        utils.logger.info('Storing new Spotify songs in DynamoDB', {
          count: newSongs.length,
        });

        const storageResult = await storeSongsInDynamoDB(newSongs, tableName);

        utils.logger.info('Spotify songs stored successfully', {
          newSongs: newSongs.length,
          stored: storageResult.successCount,
          errors: storageResult.errorCount,
        });

        utils.metrics.addMetric(
          'SpotifySongsStored',
          MetricUnit.Count,
          storageResult.successCount
        );
        utils.metrics.addMetric(
          'SpotifyStorageErrors',
          MetricUnit.Count,
          storageResult.errorCount
        );
      }

      // Record metrics
      utils.metrics.addMetric('SpotifyApiFetchSuccess', MetricUnit.Count, 1);
      utils.metrics.addMetric(
        'SpotifyTracksFetched',
        MetricUnit.Count,
        allSongs.length
      );
      utils.metrics.addMetric(
        'SpotifyNewTracks',
        MetricUnit.Count,
        newSongs.length
      );

      // Return response
      return utils.createSuccessResponse(event, {
        songs: newSongs,
        count: newSongs.length,
        totalFetched: allSongs.length,
        source: 'spotify',
        lastProcessedSongId:
          newSongs.length > 0 ? newSongs[0].id : lastProcessedSongId,
      });
    } catch (error) {
      utils.logger.error('Error fetching Spotify recently played tracks', {
        error,
      });
      utils.metrics.addMetric('SpotifyApiError', MetricUnit.Count, 1);

      // Check if it's a token-related error
      if (error instanceof Error && error.message.includes('authentication')) {
        return utils.createErrorResponse(
          event,
          error,
          HttpStatus.UNAUTHORIZED,
          'Spotify authentication failed. Please check your Spotify integration setup.'
        );
      }

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('rate limit')) {
        return utils.createErrorResponse(
          event,
          error,
          HttpStatus.TOO_MANY_REQUESTS,
          'Spotify API rate limit exceeded. Please try again later.'
        );
      }

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to fetch recently played Spotify tracks'
      );
    }
  }
);
