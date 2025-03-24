import { ScheduledHandler, Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getParameter, updateParameter } from '../../services/parameter';
import { fetchRecentTracks, processTracks } from '../../services/apple-music';
import { storeTracksInDynamoDB } from '../../services/dynamodb/track-storage';
import { putCloudWatchMetrics } from '../../services/cloudwatch-metrics';

const logger = new Logger({ serviceName: 'update-track-history' });
const tracer = new Tracer({ serviceName: 'update-track-history' });
const metrics = new Metrics({ namespace: 'update-track-history' });

interface Environment {
  DYNAMODB_TABLE_NAME: string;
  LAST_PROCESSED_TRACK_PARAMETER: string;
  MUSIC_USER_TOKEN_PARAMETER: string;
  TRACK_LIMIT_PARAMETER: string;
}

/**
 * Lambda handler for updating track history
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Apple Music History Tracker Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const env: Environment = {
      DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME!,
      LAST_PROCESSED_TRACK_PARAMETER: process.env.LAST_PROCESSED_TRACK_PARAMETER!,
      MUSIC_USER_TOKEN_PARAMETER: process.env.MUSIC_USER_TOKEN_PARAMETER!,
      TRACK_LIMIT_PARAMETER: process.env.TRACK_LIMIT_PARAMETER!
    };

    // Validate environment variables
    for (const [key, value] of Object.entries(env)) {
      if (!value) {
        logger.error(`Missing required environment variable: ${key}`);
        metrics.addMetric('ConfigurationError', MetricUnit.Count, 1);
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // Get Apple Music User Token
    const musicUserToken = await getParameter(env.MUSIC_USER_TOKEN_PARAMETER);
    if (!musicUserToken) {
      logger.error('Failed to retrieve Apple Music User Token');
      metrics.addMetric('AuthenticationError', MetricUnit.Count, 1);
      throw new Error('Failed to retrieve Apple Music User Token');
    }

    // Get last processed track ID
    const lastProcessedTrackId = await getParameter(env.LAST_PROCESSED_TRACK_PARAMETER);
    logger.info('Last processed track status', {
      lastProcessedTrackId: lastProcessedTrackId || 'No previously processed tracks'
    });

    // Fetch recent tracks
    const recentTracks = await fetchRecentTracks(musicUserToken, env.TRACK_LIMIT_PARAMETER);
    logger.info('Recent tracks fetched', { count: recentTracks.length });
    metrics.addMetric('TracksProcessed', MetricUnit.Count, recentTracks.length);

    // Process tracks and filter out already processed ones
    const newTracks = await processTracks(recentTracks, lastProcessedTrackId || '');
    logger.info('New tracks identified', { count: newTracks.length });
    metrics.addMetric('NewTracksIdentified', MetricUnit.Count, newTracks.length);

    // Store new tracks in DynamoDB
    if (newTracks.length > 0) {
      const { successCount, errorCount } = await storeTracksInDynamoDB(newTracks, env.DYNAMODB_TABLE_NAME);
      metrics.addMetric('TracksStoredSuccess', MetricUnit.Count, successCount);
      metrics.addMetric('TracksStoredError', MetricUnit.Count, errorCount);

      // Update the last processed track ID
      if (successCount > 0) {
        const mostRecentTrackId = newTracks[0].id;
        await updateParameter(env.LAST_PROCESSED_TRACK_PARAMETER, mostRecentTrackId);
        logger.info('Last processed track ID updated', { mostRecentTrackId });
      }
    } else {
      logger.info('No new tracks to store');
    }

    // Put CloudWatch metrics
    await putCloudWatchMetrics('AppleMusicHistory', [
      { name: 'TracksProcessed', value: recentTracks.length, unit: 'Count' },
      { name: 'NewTracksStored', value: newTracks.length, unit: 'Count' }
    ]);

    logger.info('Apple Music history processing complete', {
      tracksProcessed: recentTracks.length,
      newTracksStored: newTracks.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed Apple Music history',
        tracksProcessed: recentTracks.length,
        newTracksStored: newTracks.length
      })
    };
  } catch (error) {
    logger.error('Error processing Apple Music history', { error });
    metrics.addMetric('ProcessingError', MetricUnit.Count, 1);
    throw error;
  }
};
