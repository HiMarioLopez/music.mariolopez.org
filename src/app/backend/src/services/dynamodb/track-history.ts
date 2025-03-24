import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const logger = new Logger({ serviceName: 'dynamodb-track-history' });
const tracer = new Tracer({ serviceName: 'dynamodb-track-history' });

const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(dynamodbClient);
tracer.captureAWSv3Client(docClient);

// Default and maximum limits for queries
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

interface PaginationResult {
    items: any[];
    lastEvaluatedKey?: string;
}

/**
 * Get all tracks from DynamoDB with pagination
 * 
 * @param tableName - DynamoDB table name
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated tracks
 */
export const getAllTracks = async (
    tableName: string, 
    limit = DEFAULT_LIMIT, 
    startKey?: string
): Promise<PaginationResult> => {
    try {
        const effectiveLimit = Math.min(limit, MAX_LIMIT);
        
        const params: any = {
            TableName: tableName,
            Limit: effectiveLimit
        };

        // Add ExclusiveStartKey for pagination if provided
        if (startKey) {
            params.ExclusiveStartKey = { id: startKey };
        }

        logger.info('Fetching all tracks', { 
            tableName,
            limit: effectiveLimit,
            startKey: startKey || 'none'
        });

        const result = await docClient.send(new ScanCommand(params));

        // Sort by processedTimestamp (newest first)
        const tracks = result.Items || [];
        const sortedTracks = tracks.sort((a, b) => {
            const dateA = new Date(a.processedTimestamp || '').getTime();
            const dateB = new Date(b.processedTimestamp || '').getTime();
            return dateB - dateA; // Descending order (newest first)
        });

        logger.info('Retrieved tracks', { count: sortedTracks.length });

        return {
            items: sortedTracks,
            lastEvaluatedKey: result.LastEvaluatedKey?.id
        };
    } catch (error) {
        logger.error('Error fetching all tracks', { error });
        throw error;
    }
};

/**
 * Get tracks by artist name from DynamoDB with pagination
 * 
 * @param tableName - DynamoDB table name
 * @param artistName - Artist name to filter by
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated tracks
 */
export const getTracksByArtist = async (
    tableName: string,
    artistName: string,
    limit = DEFAULT_LIMIT,
    startKey?: string
): Promise<PaginationResult> => {
    try {
        const effectiveLimit = Math.min(limit, MAX_LIMIT);
        
        // Since we don't have a GSI on artistName, we need to scan with a filter
        const params: any = {
            TableName: tableName,
            FilterExpression: 'contains(artistName, :artistName)',
            ExpressionAttributeValues: {
                ':artistName': artistName
            },
            Limit: effectiveLimit
        };

        // Add ExclusiveStartKey for pagination if provided
        if (startKey) {
            params.ExclusiveStartKey = { id: startKey };
        }

        logger.info('Fetching tracks by artist', { 
            tableName,
            artistName,
            limit: effectiveLimit,
            startKey: startKey || 'none'
        });

        const result = await docClient.send(new ScanCommand(params));

        // Sort by processedTimestamp (newest first)
        const tracks = result.Items || [];
        const sortedTracks = tracks.sort((a, b) => {
            const dateA = new Date(a.processedTimestamp || '').getTime();
            const dateB = new Date(b.processedTimestamp || '').getTime();
            return dateB - dateA; // Descending order (newest first)
        });

        logger.info('Retrieved tracks by artist', { 
            artistName, 
            count: sortedTracks.length 
        });

        return {
            items: sortedTracks,
            lastEvaluatedKey: result.LastEvaluatedKey?.id
        };
    } catch (error) {
        logger.error('Error fetching tracks by artist', { artistName, error });
        throw error;
    }
};
