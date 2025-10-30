import {
  ScheduledHandler,
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getParameter, updateParameter } from '../../services/parameter';
import { fetchRecentSongs, processSongs } from '../../services/spotify';
import { storeSongsInDynamoDB } from '../../services/dynamodb/song-storage';
import { putCloudWatchMetrics } from '../../services/cloudwatch-metrics';

const logger = new Logger({ serviceName: 'update-spotify-song-history' });
const tracer = new Tracer({ serviceName: 'update-spotify-song-history' });
const metrics = new Metrics({ namespace: 'update-spotify-song-history' });

interface Environment {
  DYNAMODB_TABLE_NAME: string;
  LAST_PROCESSED_SONG_PARAMETER: string;
  SPOTIFY_ACCESS_TOKEN_PARAMETER: string;
  SONG_LIMIT_PARAMETER: string;
}

/**
 * Lambda handler for updating Spotify song history
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Spotify History Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const env: Environment = {
      DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME!,
      LAST_PROCESSED_SONG_PARAMETER: process.env.LAST_PROCESSED_SONG_PARAMETER!,
      SPOTIFY_ACCESS_TOKEN_PARAMETER:
        process.env.SPOTIFY_ACCESS_TOKEN_PARAMETER!,
      SONG_LIMIT_PARAMETER: process.env.SONG_LIMIT_PARAMETER!,
    };

    // Validate environment variables
    for (const [key, value] of Object.entries(env)) {
      if (!value) {
        logger.error(`Missing required environment variable: ${key}`);
        metrics.addMetric('ConfigurationError', MetricUnit.Count, 1);
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // Get Spotify Access Token
    const spotifyAccessToken = await getParameter(
      env.SPOTIFY_ACCESS_TOKEN_PARAMETER
    );
    if (!spotifyAccessToken) {
      logger.error('Failed to retrieve Spotify Access Token');
      metrics.addMetric('AuthenticationError', MetricUnit.Count, 1);
      throw new Error('Failed to retrieve Spotify Access Token');
    }

    // Get last processed song ID
    const lastProcessedSongId = await getParameter(
      env.LAST_PROCESSED_SONG_PARAMETER
    );
    logger.info('Last processed song status', {
      lastProcessedSongId:
        lastProcessedSongId || 'No previously processed songs',
    });

    // Fetch recent songs
    const recentSongs = await fetchRecentSongs(
      spotifyAccessToken,
      env.SONG_LIMIT_PARAMETER
    );
    logger.info('Recent songs fetched', {
      count: recentSongs.length,
      songIds: recentSongs.map((s) => s.id).join(','),
    });
    metrics.addMetric('SongsProcessed', MetricUnit.Count, recentSongs.length);

    // Process songs and filter out already processed ones
    const newSongs = await processSongs(recentSongs, lastProcessedSongId || '');
    logger.info('New songs identified', {
      count: newSongs.length,
      songIds: newSongs.map((s) => s.id).join(','),
      firstSongId: newSongs.length > 0 ? newSongs[0].id : 'none',
      lastSongId:
        newSongs.length > 0 ? newSongs[newSongs.length - 1].id : 'none',
    });
    metrics.addMetric('NewSongsIdentified', MetricUnit.Count, newSongs.length);

    // Store new songs in DynamoDB
    if (newSongs.length > 0) {
      logger.info('About to store songs in DynamoDB', {
        tableName: env.DYNAMODB_TABLE_NAME,
        songCount: newSongs.length,
      });

      const { successCount, errorCount } = await storeSongsInDynamoDB(
        newSongs,
        env.DYNAMODB_TABLE_NAME
      );

      logger.info('Songs storage completed', {
        successCount,
        errorCount,
        totalExpected: newSongs.length,
      });

      metrics.addMetric('SongsStoredSuccess', MetricUnit.Count, successCount);
      metrics.addMetric('SongsStoredError', MetricUnit.Count, errorCount);

      // Update the last processed song ID
      if (successCount > 0) {
        const mostRecentSongId = newSongs[0].id;
        await updateParameter(
          env.LAST_PROCESSED_SONG_PARAMETER,
          mostRecentSongId
        );
        logger.info('Last processed song ID updated', { mostRecentSongId });
      }
    } else {
      logger.info('No new songs to store');
    }

    // Put CloudWatch metrics
    await putCloudWatchMetrics('SpotifyHistory', [
      { name: 'SongsProcessed', value: recentSongs.length, unit: 'Count' },
      { name: 'NewSongsStored', value: newSongs.length, unit: 'Count' },
    ]);

    logger.info('Spotify history processing complete', {
      songsProcessed: recentSongs.length,
      newSongsStored: newSongs.length,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed Spotify history',
        songsProcessed: recentSongs.length,
        newSongsStored: newSongs.length,
      }),
    };
  } catch (error) {
    logger.error('Error processing Spotify history', { error });
    metrics.addMetric('ProcessingError', MetricUnit.Count, 1);
    throw error;
  }
};

