import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  ScanCommand,
  ScanCommandInput,
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

// Note object structure for recommendations
export interface NoteItem {
  from: string;
  note: string;
  noteTimestamp: string;
}

// Define types for recommendations based on front-end types
export interface BaseRecommendation {
  entityType: string;
  timestamp: string;
  notes?: NoteItem[];
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

    // Create query parameters with GSI for sorting by votes
    const params: any = {
      TableName: tableName,
      IndexName: 'EntityTypeVotesIndex', // Use the GSI for sorting by votes
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': 'SONG', // Query by one entity type at a time, will combine results
      },
      ScanIndexForward: false, // Descending order by votes
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

    logger.info('Querying song recommendations by votes', {
      tableName,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    // Query for SONG type
    const songResult = await docClient.send(new QueryCommand(params));
    const songRecommendations = songResult.Items || [];

    // Update params for ALBUM type
    params.ExpressionAttributeValues = {
      ':entityType': 'ALBUM',
    };
    logger.info('Querying album recommendations by votes');
    const albumResult = await docClient.send(new QueryCommand(params));
    const albumRecommendations = albumResult.Items || [];

    // Update params for ARTIST type
    params.ExpressionAttributeValues = {
      ':entityType': 'ARTIST',
    };
    logger.info('Querying artist recommendations by votes');
    const artistResult = await docClient.send(new QueryCommand(params));
    const artistRecommendations = artistResult.Items || [];

    // Combine and sort all recommendations by votes (highest first)
    const allRecommendations = [
      ...songRecommendations,
      ...albumRecommendations,
      ...artistRecommendations,
    ]
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, effectiveLimit);

    logger.info('Retrieved combined recommendations', {
      count: allRecommendations.length,
    });

    // For pagination, we'd need a more complex approach with combined results
    // For now, we'll skip pagination for combined results
    let lastEvaluatedKey = undefined;

    return {
      items: allRecommendations,
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
 * @param tableIndexName - DynamoDB table index name
 * @param entityType - Type to filter by (SONG, ALBUM, or ARTIST)
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export const getRecommendationsByEntityType = async (
  tableName: string,
  tableIndexName: string,
  entityType: 'SONG' | 'ALBUM' | 'ARTIST',
  limit = DEFAULT_LIMIT,
  startKey?: string
): Promise<PaginationResult> => {
  try {
    const effectiveLimit = Math.min(limit, MAX_LIMIT);

    // Use QueryCommand with the GSI
    const params: any = {
      TableName: tableName,
      IndexName: tableIndexName, // Use the GSI for sorting by votes
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

    logger.info('Querying recommendations by type using GSI', {
      tableName,
      entityType,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    const result = await docClient.send(new QueryCommand(params));

    // Results are already sorted by votes due to GSI sort key and ScanIndexForward: false
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

    logger.info('Scanning recommendations by creator in notes array', {
      tableName,
      fromPerson,
      limit: effectiveLimit,
      startKey: startKey || 'none',
    });

    // Get all recommendations and filter client-side for those that have
    // a note from the specified person to handle the nested array search
    const scanParams: ScanCommandInput = {
      TableName: tableName,
      Limit: 1000, // Get more items than needed to filter through
    };

    // Add ExclusiveStartKey for pagination if provided
    if (startKey) {
      try {
        scanParams.ExclusiveStartKey = JSON.parse(startKey);
      } catch (e) {
        logger.error('Failed to parse startKey', { startKey, error: e });
      }
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    // Filter manually to find recommendations where any note has matching 'from'
    const recommendations = (result.Items || [])
      .filter((item) => {
        // Handle both old schema (from field directly on item) and new schema (notes array)
        if (item.from === fromPerson) {
          return true;
        }

        if (Array.isArray(item.notes)) {
          return item.notes.some((note) => note.from === fromPerson);
        }

        return false;
      })
      .sort((a, b) => (b.votes || 0) - (a.votes || 0)) // Sort by votes
      .slice(0, effectiveLimit); // Apply limit

    logger.info('Retrieved recommendations by creator', {
      fromPerson,
      count: recommendations.length,
    });

    // Pagination won't work properly with client-side filtering
    // We're not returning a LastEvaluatedKey intentionally
    let lastEvaluatedKey = undefined;

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

    // Default votes to 1 for new recommendations
    const votes = 1;

    // Create a complete recommendation object with entityType and timestamp
    let completeRecommendation: Recommendation;

    // Handle legacy input format with from/note fields
    let notes: NoteItem[] | undefined = recommendation.notes;

    // Create the appropriate recommendation type based on the 'type' property
    if (recommendation.entityType === 'SONG') {
      completeRecommendation = {
        ...(recommendation as Omit<SongRecommendation, 'timestamp' | 'votes'>),
        entityType: 'SONG',
        timestamp,
        votes,
        notes,
      } as SongRecommendation;
    } else if (recommendation.entityType === 'ALBUM') {
      completeRecommendation = {
        ...(recommendation as Omit<AlbumRecommendation, 'timestamp' | 'votes'>),
        entityType: 'ALBUM',
        timestamp,
        votes,
        notes,
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
        notes,
      } as ArtistRecommendation;
    } else {
      throw new Error(
        `Invalid recommendation type: ${(recommendation as any).entityType}`
      );
    }

    logger.info('Creating new recommendation', {
      tableName,
      entityType: recommendation.entityType,
      hasNotes: !!notes,
      notesCount: notes?.length || 0,
    });

    // Log the complete recommendation for debugging
    logger.info('Complete recommendation object', {
      completeRecommendation: JSON.stringify(completeRecommendation),
    });

    // Ensure notes is properly formatted for DynamoDB
    // This avoids potential issues with complex nested objects
    if (
      completeRecommendation.notes &&
      Array.isArray(completeRecommendation.notes)
    ) {
      logger.info('Notes array found, preparing for DynamoDB', {
        notesCount: completeRecommendation.notes.length,
      });

      // Create a clean copy to ensure it's properly formatted for DynamoDB
      const cleanItem = {
        ...completeRecommendation,
        notes: JSON.parse(JSON.stringify(completeRecommendation.notes)),
      };

      // Use PutCommand to add the recommendation to DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: cleanItem,
        })
      );
    } else {
      logger.warn('No notes array found or invalid format', {
        notesValue: completeRecommendation.notes,
      });

      // Use PutCommand to add the recommendation to DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: completeRecommendation,
        })
      );
    }

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
