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

    for (const track of tracks) {
        try {
            // Create a hash ID to deduplicate tracks
            const hashId = createHash('sha256')
                .update(`${track.artistName}-${track.name}-${track.albumName}`)
                .digest('hex');

            // Create a new object without the id property to avoid duplication
            const { id, ...trackWithoutId } = track;

            await docClient.send(
                new PutCommand({
                    TableName: tableName,
                    Item: {
                        id: hashId,
                        trackId: id, // Store the original id as a different field
                        ...trackWithoutId
                    }
                })
            );

            successCount++;
            logger.debug('Successfully stored track', { 
                trackId: id, 
                trackName: track.name, 
                artistName: track.artistName 
            });
        } catch (error) {
            errorCount++;
            logger.error('Error storing track in DynamoDB', { 
                error,
                trackId: track.id,
                artistName: track.artistName,
                name: track.name
            });
        }
    }

    logger.info('Track storage results', { successCount, errorCount });

    // If all operations failed, throw an error
    if (errorCount > 0 && successCount === 0) {
        throw new Error(`Failed to store any tracks in DynamoDB. All ${errorCount} operations failed.`);
    }

    return { successCount, errorCount };
};
