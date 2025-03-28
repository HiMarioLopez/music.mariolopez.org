import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const logger = new Logger({ serviceName: 'dynamodb-recommendations' });
const tracer = new Tracer({ serviceName: 'dynamodb-recommendations' });

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

// Define types for recommendations based on front-end types
export interface BaseRecommendation {
  entityType: string;
  timestamp: string;
  from?: string;
  note?: string;
  votes?: number;
}

export interface SongRecommendation extends BaseRecommendation {
  songTitle: string;
  artistName: string;
  albumName: string;
  albumCoverUrl: string;
  entityType: 'SONG';
}

export interface AlbumRecommendation extends BaseRecommendation {
  albumTitle: string;
  artistName: string;
  albumCoverUrl: string;
  trackCount?: number;
  releaseDate?: string;
  entityType: 'ALBUM';
}

export interface ArtistRecommendation extends BaseRecommendation {
  artistName: string;
  artistImageUrl: string;
  genres?: string[];
  entityType: 'ARTIST';
}

export type Recommendation =
  | SongRecommendation
  | AlbumRecommendation
  | ArtistRecommendation;

/**
 * Get all recommendations from DynamoDB sorted by votes (highest first) with pagination
 *
 * @param tableName - DynamoDB table name
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export const getAllRecommendations = async (
  tableName: string,
  limit = DEFAULT_LIMIT,
  startKey?: string
): Promise<PaginationResult> => {
  try {
    const effectiveLimit = Math.min(limit, MAX_LIMIT);

    // Create query parameters for scanning all entity types
    const params: any = {
      TableName: tableName,
      FilterExpression: 'entityType IN (:song, :album, :artist)',
      ExpressionAttributeValues: {
        ':song': 'SONG',
        ':album': 'ALBUM',
        ':artist': 'ARTIST',
      },
      ScanIndexForward: false, // Descending order by sort key (votes)
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

    logger.info('Querying all recommendations by votes', {
      tableName,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    // Use QueryCommand
    const result = await docClient.send(new QueryCommand(params));

    // Items are already sorted by votes (highest first) due to ScanIndexForward: false
    const recommendations = result.Items || [];

    logger.info('Retrieved recommendations', {
      count: recommendations.length,
    });

    // Stringify the LastEvaluatedKey for pagination
    let lastEvaluatedKey = undefined;
    if (result.LastEvaluatedKey) {
      lastEvaluatedKey = JSON.stringify(result.LastEvaluatedKey);
    }

    return {
      items: recommendations,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error fetching all recommendations', { error });
    throw error;
  }
};

/**
 * Get recommendations by type from DynamoDB with pagination
 *
 * @param tableName - DynamoDB table name
 * @param entityType - Type to filter by (SONG, ALBUM, or ARTIST)
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export const getRecommendationsByEntityType = async (
  tableName: string,
  entityType: 'SONG' | 'ALBUM' | 'ARTIST',
  limit = DEFAULT_LIMIT,
  startKey?: string
): Promise<PaginationResult> => {
  try {
    const effectiveLimit = Math.min(limit, MAX_LIMIT);

    // Use QueryCommand with FilterExpression
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': entityType,
      },
      ScanIndexForward: false, // Descending order by votes
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

    logger.info('Querying recommendations by type', {
      tableName,
      entityType,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    const result = await docClient.send(new QueryCommand(params));

    // Results are already sorted by votes
    const recommendations = result.Items || [];

    logger.info('Retrieved recommendations by type', {
      entityType,
      count: recommendations.length,
    });

    // Stringify the LastEvaluatedKey for pagination
    let lastEvaluatedKey = undefined;
    if (result.LastEvaluatedKey) {
      lastEvaluatedKey = JSON.stringify(result.LastEvaluatedKey);
    }

    return {
      items: recommendations,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error fetching recommendations by type', {
      error,
      entityType,
    });
    throw error;
  }
};

/**
 * Get recommendations by creator ("from" field) from DynamoDB with pagination
 *
 * @param tableName - DynamoDB table name
 * @param fromPerson - Creator name to filter by
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export const getRecommendationsByFrom = async (
  tableName: string,
  fromPerson: string,
  limit = DEFAULT_LIMIT,
  startKey?: string
): Promise<PaginationResult> => {
  try {
    const effectiveLimit = Math.min(limit, MAX_LIMIT);

    // Use QueryCommand with FilterExpression for creator filter
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: 'entityType = :entityType',
      FilterExpression: '#from = :from',
      ExpressionAttributeNames: {
        '#from': 'from',
      },
      ExpressionAttributeValues: {
        ':entityType': 'SONG',
        ':from': fromPerson,
      },
      ScanIndexForward: false, // Descending order by votes
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

    logger.info('Querying recommendations by creator', {
      tableName,
      fromPerson,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    const result = await docClient.send(new QueryCommand(params));

    // Results are already sorted by votes (highest first) due to ScanIndexForward: false
    const recommendations = result.Items || [];

    logger.info('Retrieved recommendations by creator', {
      fromPerson,
      count: recommendations.length,
    });

    // Stringify the LastEvaluatedKey for pagination
    let lastEvaluatedKey = undefined;
    if (result.LastEvaluatedKey) {
      lastEvaluatedKey = JSON.stringify(result.LastEvaluatedKey);
    }

    return {
      items: recommendations,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error fetching recommendations by creator', {
      error,
      fromPerson,
    });
    throw error;
  }
};

/**
 * Create a new recommendation in DynamoDB
 *
 * @param tableName - DynamoDB table name
 * @param recommendation - Recommendation data to store
 * @returns Promise resolving to the created recommendation
 */
export const createRecommendation = async (
  tableName: string,
  recommendation: Omit<Recommendation, 'timestamp' | 'votes'>
): Promise<Recommendation> => {
  try {
    // Generate current timestamp
    const timestamp = new Date().toISOString();

    // Default votes to 0 for new recommendations
    const votes = 0;

    // Create a complete recommendation object with entityType and timestamp
    let completeRecommendation: Recommendation;

    // Create the appropriate recommendation type based on the 'type' property
    if (recommendation.entityType === 'SONG') {
      completeRecommendation = {
        ...(recommendation as Omit<SongRecommendation, 'timestamp' | 'votes'>),
        entityType: 'SONG',
        timestamp,
        votes,
      } as SongRecommendation;
    } else if (recommendation.entityType === 'ALBUM') {
      completeRecommendation = {
        ...(recommendation as Omit<AlbumRecommendation, 'timestamp' | 'votes'>),
        entityType: 'ALBUM',
        timestamp,
        votes,
      } as AlbumRecommendation;
    } else if (recommendation.entityType === 'ARTIST') {
      completeRecommendation = {
        ...(recommendation as Omit<
          ArtistRecommendation,
          'timestamp' | 'votes'
        >),
        entityType: 'ARTIST',
        timestamp,
        votes,
      } as ArtistRecommendation;
    } else {
      throw new Error(
        `Invalid recommendation type: ${(recommendation as any).entityType}`
      );
    }

    logger.info('Creating new recommendation', {
      tableName,
      entityType: recommendation.entityType,
    });

    // Use PutCommand to add the recommendation to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: completeRecommendation,
      })
    );

    logger.info('Successfully created recommendation', {
      entityType: recommendation.entityType,
    });

    return completeRecommendation;
  } catch (error) {
    logger.error('Error creating recommendation', { error });
    throw error;
  }
};

/**
 * Update votes for a recommendation in DynamoDB
 *
 * @param tableName - DynamoDB table name
 * @param entityType - Entity type (SONG, ALBUM, or ARTIST)
 * @param votes - Current vote count
 * @param newVotes - New vote count to set
 * @returns Promise resolving to the updated recommendation
 */
export const updateRecommendationVotes = async (
  tableName: string,
  entityType: string,
  votes: number,
  newVotes: number
): Promise<void> => {
  try {
    // Not implementing full update logic here as it would require additional attributes
    // to uniquely identify the record. In a real implementation, you would need a
    // more complex update that uses additional attributes in the query.
    logger.info('Updating recommendation votes', {
      tableName,
      entityType,
      currentVotes: votes,
      newVotes,
    });

    // This is a simplified placeholder - real implementation would need more parameters
    throw new Error(
      'Not implemented: This function needs additional identifiers to update votes'
    );
  } catch (error) {
    logger.error('Error updating recommendation votes', { error });
    throw error;
  }
};
