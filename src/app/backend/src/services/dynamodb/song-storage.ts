import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'crypto';
import { Song, isAppleMusicSong, isSpotifySong } from '../../models/song';

const logger = new Logger({ serviceName: 'dynamodb-song-service' });
const tracer = new Tracer({ serviceName: 'dynamodb-song-service' });

const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(dynamodbClient);
tracer.captureAWSv3Client(docClient);

/**
 * Store songs in DynamoDB
 *
 * @param songs - Array of Song objects to store
 * @param tableName - DynamoDB table name
 * @returns Promise resolving with storage stats
 */
export const storeSongsInDynamoDB = async (
  songs: Song[],
  tableName: string
): Promise<{ successCount: number; errorCount: number }> => {
  let successCount = 0;
  let errorCount = 0;

  logger.info(`Starting to store ${songs.length} songs in DynamoDB`, {
    tableName,
  });

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    try {
      // Create a hash ID to deduplicate songs
      const hashId = createHash('sha256')
        .update(`${song.artistName}-${song.name}-${song.albumName}`)
        .digest('hex');

      logger.debug(`Processing song ${i + 1}/${songs.length}`, {
        songId: song.id,
        hashId: hashId.substring(0, 8) + '...',
        artistName: song.artistName,
        songName: song.name,
      });

      // Create a new object without the id property to avoid duplication
      const { id, ...songWithoutId } = song;

      // Ensure we have a processedTimestamp
      if (!songWithoutId.processedTimestamp) {
        songWithoutId.processedTimestamp = new Date().toISOString();
      }

      logger.debug(`Storing song in DynamoDB`, {
        songIndex: i,
        entityType: 'SONG',
        processedTimestamp: songWithoutId.processedTimestamp,
        songId: id,
        source: song.source,
      });

      // Create the base item with common fields
      const item: Record<string, any> = {
        entityType: 'SONG',
        processedTimestamp: songWithoutId.processedTimestamp,
        id: hashId,
        songId: id,
        artistName: song.artistName,
        name: song.name,
        albumName: song.albumName,
        source: song.source,
        artworkUrl: song.artworkUrl,
        url: song.url,
      };

      // Add Apple Music specific fields
      if (isAppleMusicSong(song)) {
        item.genreNames = song.genreNames;
        item.trackNumber = song.trackNumber;
        item.durationInMillis = song.durationInMillis;
        item.releaseDate = song.releaseDate;
        item.isrc = song.isrc;
        item.composerName = song.composerName;
        item.hasLyrics = song.hasLyrics;
        item.isAppleDigitalMaster = song.isAppleDigitalMaster;
        item.artworkColors = song.artworkColors;
      }

      // Add Spotify specific fields
      if (isSpotifySong(song)) {
        item.spotifyId = song.spotifyId;
        item.spotifyUrl = song.spotifyUrl;
        item.durationMs = song.durationMs;
        item.popularity = song.popularity;
        item.previewUrl = song.previewUrl;
        item.externalUrls = song.externalUrls;
        item.albumId = song.albumId;
        item.artistId = song.artistId;
        item.discNumber = song.discNumber;
        item.trackNumber = song.trackNumber;
        item.isLocal = song.isLocal;
        item.isExplicit = song.isExplicit;
      }

      // Make sure we're using a unique processedTimestamp for each record
      // This is important since it's our sort key
      if (i > 0) {
        // Add millisecond offset to ensure uniqueness
        const timestamp = new Date(item.processedTimestamp);
        timestamp.setMilliseconds(timestamp.getMilliseconds() + i);
        item.processedTimestamp = timestamp.toISOString();
        logger.debug('Adjusted timestamp for uniqueness', {
          songIndex: i,
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
      logger.info(`Successfully stored song ${i + 1}/${songs.length}`, {
        songId: id,
        songName: song.name,
        artistName: song.artistName,
        successCount,
      });
    } catch (error) {
      errorCount++;
      logger.error(`Error storing song ${i + 1}/${songs.length}`, {
        songId: song?.id || 'unknown',
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorCount,
      });
    }
  }

  logger.info('Song storage completed', {
    totalSongs: songs.length,
    successCount,
    errorCount,
  });

  // If all operations failed, throw an error
  if (errorCount > 0 && successCount === 0) {
    throw new Error(
      `Failed to store any songs in DynamoDB. All ${errorCount} operations failed.`
    );
  }

  return { successCount, errorCount };
};
