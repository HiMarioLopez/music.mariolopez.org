import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'crypto';
import { Track } from '../../models/track';

const logger = new Logger({ serviceName: 'dynamodb-track-service' });
const tracer = new Tracer({ serviceName: 'dynamodb-track-service' });

const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(dynamodbClient);
tracer.captureAWSv3Client(docClient);

/**
 * Store tracks in DynamoDB
 *
 * @param tracks - Array of Track objects to store
 * @param tableName - DynamoDB table name
 * @returns Promise resolving with storage stats
 */
export const storeTracksInDynamoDB = async (
  tracks: Track[],
  tableName: string
): Promise<{ successCount: number; errorCount: number }> => {
  let successCount = 0;
  let errorCount = 0;

  logger.info(`Starting to store ${tracks.length} tracks in DynamoDB`, {
    tableName,
  });

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    try {
      // Create a hash ID to deduplicate tracks
      const hashId = createHash('sha256')
        .update(`${track.artistName}-${track.name}-${track.albumName}`)
        .digest('hex');

      logger.debug(`Processing track ${i + 1}/${tracks.length}`, {
        trackId: track.id,
        hashId: hashId.substring(0, 8) + '...',
        artistName: track.artistName,
        trackName: track.name,
      });

      // Create a new object without the id property to avoid duplication
      const { id, ...trackWithoutId } = track;

      // Ensure we have a processedTimestamp
      if (!trackWithoutId.processedTimestamp) {
        trackWithoutId.processedTimestamp = new Date().toISOString();
      }

      logger.debug(`Storing track in DynamoDB`, {
        trackIndex: i,
        entityType: 'TRACK',
        processedTimestamp: trackWithoutId.processedTimestamp,
        trackId: id,
      });

      // Create the item to be stored
      const item = {
        entityType: 'TRACK',
        processedTimestamp: trackWithoutId.processedTimestamp,
        id: hashId,
        trackId: id,
        artistName: track.artistName,
        name: track.name,
        albumName: track.albumName,
        genreNames: track.genreNames,
        trackNumber: track.trackNumber,
        durationInMillis: track.durationInMillis,
        releaseDate: track.releaseDate,
        isrc: track.isrc,
        artworkUrl: track.artworkUrl,
        composerName: track.composerName,
        url: track.url,
        hasLyrics: track.hasLyrics,
        isAppleDigitalMaster: track.isAppleDigitalMaster,
        artworkColors: track.artworkColors,
      };

      // Make sure we're using a unique processedTimestamp for each record
      // This is important since it's our sort key
      if (i > 0) {
        // Add millisecond offset to ensure uniqueness
        const timestamp = new Date(item.processedTimestamp);
        timestamp.setMilliseconds(timestamp.getMilliseconds() + i);
        item.processedTimestamp = timestamp.toISOString();
        logger.debug('Adjusted timestamp for uniqueness', {
          trackIndex: i,
          newTimestamp: item.processedTimestamp,
        });
      }

      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );

      successCount++;
      logger.info(`Successfully stored track ${i + 1}/${tracks.length}`, {
        trackId: id,
        trackName: track.name,
        artistName: track.artistName,
        successCount,
      });
    } catch (error) {
      errorCount++;
      logger.error(`Error storing track ${i + 1}/${tracks.length}`, {
        trackId: track?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorCount,
      });
    }
  }

  logger.info('Track storage completed', {
    totalTracks: tracks.length,
    successCount,
    errorCount,
  });

  // If all operations failed, throw an error
  if (errorCount > 0 && successCount === 0) {
    throw new Error(
      `Failed to store any tracks in DynamoDB. All ${errorCount} operations failed.`
    );
  }

  return { successCount, errorCount };
};
