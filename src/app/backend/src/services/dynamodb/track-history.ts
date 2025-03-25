import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

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

    // Create query parameters
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': 'TRACK',
      },
      ScanIndexForward: false, // Descending order by sort key (timestamp)
      Limit: effectiveLimit,
    };

    // Add ExclusiveStartKey for pagination if provided
    if (startKey) {
      try {
        // Parse the JSON string from the encoded startKey
        params.ExclusiveStartKey = JSON.parse(startKey);
      } catch (e) {
        logger.error('Failed to parse startKey', { startKey, error: e });
      }
    }

    logger.info('Querying all tracks', {
      tableName,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    // Use QueryCommand instead of ScanCommand
    const result = await docClient.send(new QueryCommand(params));

    // Items are already sorted by timestamp (newest first) due to ScanIndexForward: false
    const tracks = result.Items || [];

    logger.info('Retrieved tracks', {
      count: tracks.length,
    });

    // Stringify the LastEvaluatedKey for pagination
    let lastEvaluatedKey = undefined;
    if (result.LastEvaluatedKey) {
      lastEvaluatedKey = JSON.stringify(result.LastEvaluatedKey);
    }

    return {
      items: tracks,
      lastEvaluatedKey,
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

    // Use QueryCommand with FilterExpression
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: 'entityType = :entityType',
      FilterExpression: 'contains(artistName, :artistName)',
      ExpressionAttributeValues: {
        ':entityType': 'TRACK',
        ':artistName': artistName,
      },
      ScanIndexForward: false, // Descending order by timestamp
      Limit: effectiveLimit,
    };

    // Add ExclusiveStartKey for pagination if provided
    if (startKey) {
      try {
        params.ExclusiveStartKey = JSON.parse(startKey);
      } catch (e) {
        logger.error('Failed to parse startKey', { startKey, error: e });
      }
    }

    logger.info('Querying tracks by artist', {
      tableName,
      artistName,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    const result = await docClient.send(new QueryCommand(params));

    // Results are already sorted due to ScanIndexForward: false
    const tracks = result.Items || [];

    logger.info('Retrieved tracks by artist', {
      artistName,
      count: tracks.length,
    });

    // Stringify the LastEvaluatedKey for pagination
    let lastEvaluatedKey = undefined;
    if (result.LastEvaluatedKey) {
      lastEvaluatedKey = JSON.stringify(result.LastEvaluatedKey);
    }

    return {
      items: tracks,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error fetching tracks by artist', { artistName, error });
    throw error;
  }
};
