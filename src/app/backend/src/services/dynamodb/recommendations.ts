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
import { PaginationResult } from '../../models/pagination-result';
import { AlbumRecommendation, ArtistRecommendation, EntityType, Recommendation, SongRecommendation, UserInteractionStatus } from '../../models/recommendation';
import { generateUUID } from '../../utils/uuid';

const logger = new Logger({ serviceName: 'dynamodb-recommendations' });
const tracer = new Tracer({ serviceName: 'dynamodb-recommendations' });

const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(dynamodbClient);
tracer.captureAWSv3Client(docClient);

// Default and maximum limits for recommendation queries
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Get all recommendations from DynamoDB sorted by votes (highest first) with pagination
 * 
 * @param tableName - DynamoDB table name
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export async function getAllRecommendations(
  tableName: string,
  limit = DEFAULT_LIMIT,
  startKey?: string,
): Promise<PaginationResult> {
  // Cap the limit at maximum
  const cappedLimit = Math.min(limit, MAX_LIMIT);

  // Create the scan parameters
  const params: ScanCommandInput = {
    TableName: tableName,
    Limit: cappedLimit,
  };

  // Add starting key for pagination if provided
  if (startKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(startKey);
    } catch (error) {
      logger.error('Error parsing pagination token', { error });
      throw new Error('Invalid pagination token');
    }
  }

  try {
    logger.info('Scanning for all recommendations', {
      tableName,
      limit: cappedLimit,
    });

    // Execute the scan command
    const result = await docClient.send(new ScanCommand(params));

    const items = result.Items || [];
    const lastEvaluatedKey = result.LastEvaluatedKey
      ? JSON.stringify(result.LastEvaluatedKey)
      : undefined;

    logger.info('Recommendations scan completed', {
      count: items.length,
      hasMore: !!lastEvaluatedKey,
    });

    // Sort items by votes (descending) since DynamoDB Scan doesn't support sorting
    const sortedItems = items.sort(
      (a, b) => (b.votes || 0) - (a.votes || 0)
    );

    return {
      items: sortedItems,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error scanning for recommendations', { error });
    throw error;
  }
}

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
export async function getRecommendationsByEntityType(
  tableName: string,
  tableIndexName: string,
  entityType: EntityType,
  limit = DEFAULT_LIMIT,
  startKey?: string,
): Promise<PaginationResult> {
  // Cap the limit at maximum
  const cappedLimit = Math.min(limit, MAX_LIMIT);

  // Create the query parameters
  const params: any = {
    TableName: tableName,
    IndexName: tableIndexName,
    KeyConditionExpression: 'entityType = :entityType',
    ExpressionAttributeValues: {
      ':entityType': entityType,
    },
    ScanIndexForward: false, // descending order (for numeric sort key)
    Limit: cappedLimit,
  };

  // Add starting key for pagination if provided
  if (startKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(startKey);
    } catch (error) {
      logger.error('Error parsing pagination token', { error });
      throw new Error('Invalid pagination token');
    }
  }

  try {
    logger.info('Querying for recommendations by entityType', {
      tableName,
      entityType,
      limit: cappedLimit,
    });

    // Execute the query command
    const result = await docClient.send(new QueryCommand(params));

    const items = result.Items || [];
    const lastEvaluatedKey = result.LastEvaluatedKey
      ? JSON.stringify(result.LastEvaluatedKey)
      : undefined;

    logger.info('Recommendations query completed', {
      count: items.length,
      hasMore: !!lastEvaluatedKey,
    });

    return {
      items,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error querying recommendations by entityType', { error });
    throw error;
  }
}

/**
 * Create a new recommendation in DynamoDB
 *
 * @param tableName - DynamoDB table name
 * @param recommendation - Recommendation data to store
 * @returns Promise resolving to the created recommendation
 */
export async function createRecommendation(
  tableName: string,
  recommendation: Omit<Recommendation, 'createdAt' | 'votes' | 'recommendationId' | 'reviewedByMario'>
): Promise<Recommendation> {
  try {
    // Generate current timestamp
    const createdAt = new Date().toISOString();

    // Default votes to 1 for new recommendations
    const votes = 1;

    // Generate a UUID for the recommendation
    const recommendationId = generateUUID();

    // Default reviewedByMario to false
    const reviewedByMario = false;

    // Log the input recommendation
    logger.info('Creating recommendation from input', {
      entityType: recommendation.entityType,
    });

    // Create a complete recommendation object with entityType and timestamp
    let completeRecommendation: Recommendation;

    // Create the appropriate recommendation type based on the 'type' property
    if (recommendation.entityType === 'SONG') {
      completeRecommendation = {
        ...(recommendation as Omit<SongRecommendation, 'createdAt' | 'votes' | 'recommendationId' | 'reviewedByMario'>),
        entityType: 'SONG',
        createdAt,
        votes,
        recommendationId,
        reviewedByMario,
      } as SongRecommendation;
    } else if (recommendation.entityType === 'ALBUM') {
      completeRecommendation = {
        ...(recommendation as Omit<AlbumRecommendation, 'createdAt' | 'votes' | 'recommendationId' | 'reviewedByMario'>),
        entityType: 'ALBUM',
        createdAt,
        votes,
        recommendationId,
        reviewedByMario,
      } as AlbumRecommendation;
    } else if (recommendation.entityType === 'ARTIST') {
      completeRecommendation = {
        ...(recommendation as Omit<
          ArtistRecommendation,
          'createdAt' | 'votes' | 'recommendationId' | 'reviewedByMario'
        >),
        entityType: 'ARTIST',
        createdAt,
        votes,
        recommendationId,
        reviewedByMario,
      } as ArtistRecommendation;
    } else {
      throw new Error(
        `Invalid recommendation type: ${(recommendation as any).entityType}`
      );
    }

    // Log the complete recommendation
    logger.info('Complete recommendation object', {
      entityType: completeRecommendation.entityType,
      recommendationId: completeRecommendation.recommendationId,
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
      recommendationId: completeRecommendation.recommendationId,
    });

    return completeRecommendation;
  } catch (error) {
    logger.error('Error creating recommendation', { error });
    throw error;
  }
}

/**
 * Update votes for a recommendation in DynamoDB
 *
 * @param tableName - DynamoDB table name
 * @param entityType - Entity type (SONG, ALBUM, or ARTIST)
 * @param votes - Current vote count
 * @param newVotes - New vote count to set
 * @returns Promise resolving to the updated recommendation
 */
export async function updateRecommendationVotes(
  tableName: string,
  entityType: string,
  votes: number,
  newVotes: number
): Promise<void> {
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
}

/**
 * Get a specific recommendation by its identifying attributes
 * 
 * @param tableName - DynamoDB table name
 * @param entityType - Type of recommendation (SONG, ALBUM, or ARTIST)
 * @param attributes - Identifying attributes based on entity type
 * @returns Promise resolving to the recommendation if found, null otherwise
 */
export async function getRecommendation(
  tableName: string,
  entityType: EntityType,
  attributes: {
    songTitle?: string;
    artistName: string;
    albumName?: string;
    albumTitle?: string;
  }
): Promise<Recommendation | null> {
  try {
    logger.info('Looking for existing recommendation', {
      tableName,
      entityType,
      attributes,
    });

    // Construct filter expression and attribute values based on entity type
    let filterExpression = 'entityType = :entityType';
    let expressionAttributeValues: Record<string, any> = {
      ':entityType': entityType,
    };

    if (entityType === 'SONG') {
      if (!attributes.songTitle || !attributes.artistName || !attributes.albumName) {
        throw new Error('songTitle, artistName, and albumName are required for SONG recommendations');
      }
      filterExpression += ' AND songTitle = :songTitle AND artistName = :artistName AND albumName = :albumName';
      expressionAttributeValues[':songTitle'] = attributes.songTitle;
      expressionAttributeValues[':artistName'] = attributes.artistName;
      expressionAttributeValues[':albumName'] = attributes.albumName;
    } else if (entityType === 'ALBUM') {
      if (!attributes.albumTitle || !attributes.artistName) {
        throw new Error('albumTitle and artistName are required for ALBUM recommendations');
      }
      filterExpression += ' AND albumTitle = :albumTitle AND artistName = :artistName';
      expressionAttributeValues[':albumTitle'] = attributes.albumTitle;
      expressionAttributeValues[':artistName'] = attributes.artistName;
    } else if (entityType === 'ARTIST') {
      if (!attributes.artistName) {
        throw new Error('artistName is required for ARTIST recommendations');
      }
      filterExpression += ' AND artistName = :artistName';
      expressionAttributeValues[':artistName'] = attributes.artistName;
    }

    // Configure scan parameters
    const params = {
      TableName: tableName,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    logger.info('Scanning for existing recommendation', {
      filterExpression,
      expressionAttributeValues,
    });

    // Execute scan
    const result = await docClient.send(new ScanCommand(params));

    if (result.Items && result.Items.length > 0) {
      logger.info('Found existing recommendation', {
        entityType,
        count: result.Items.length,
      });
      return result.Items[0] as Recommendation;
    }

    logger.info('No existing recommendation found');
    return null;
  } catch (error) {
    logger.error('Error looking for existing recommendation', { error });
    throw error;
  }
}

/**
 * Update an existing recommendation in DynamoDB
 * 
 * @param tableName - DynamoDB table name
 * @param existingRecommendation - The existing recommendation to update
 * @param updates - Updates to apply (new notes)
 * @returns Promise resolving to the updated recommendation
 */
export async function updateRecommendation(
  tableName: string,
  existingRecommendation: Recommendation,
  updates: {
    voteChange?: number;
    userStatus?: UserInteractionStatus;
    reviewedByMario?: boolean;
  }
): Promise<Recommendation> {
  try {
    logger.info('Updating recommendation', {
      tableName,
      entityType: existingRecommendation.entityType,
      voteChange: updates.voteChange,
      userStatus: updates.userStatus,
      reviewedByMario: updates.reviewedByMario,
    });

    // Create the updated recommendation
    const updatedRecommendation: Recommendation = {
      ...existingRecommendation
    };

    // Update votes if a vote change is provided
    if (updates.voteChange !== undefined) {
      const currentVotes = existingRecommendation.votes || 0;
      updatedRecommendation.votes = Math.max(0, currentVotes + updates.voteChange);

      logger.info('Updating vote count', {
        oldVotes: currentVotes,
        change: updates.voteChange,
        newVotes: updatedRecommendation.votes
      });
    }

    // Update user status if provided
    if (updates.userStatus !== undefined) {
      updatedRecommendation.userStatus = updates.userStatus;
      logger.info('Updating user status', {
        newStatus: updates.userStatus
      });
    }

    // Update reviewedByMario if provided
    if (updates.reviewedByMario !== undefined) {
      updatedRecommendation.reviewedByMario = updates.reviewedByMario;
      logger.info('Updating reviewedByMario', {
        newValue: updates.reviewedByMario
      });
    }

    // Use PutCommand to update the recommendation in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: updatedRecommendation,
      })
    );

    logger.info('Successfully updated recommendation', {
      entityType: existingRecommendation.entityType,
      recommendationId: existingRecommendation.recommendationId,
    });

    return updatedRecommendation;
  } catch (error) {
    logger.error('Error updating recommendation', { error });
    throw error;
  }
}

/**
 * Get a recommendation by its ID
 * 
 * @param tableName - DynamoDB table name
 * @param recommendationId - The unique ID of the recommendation
 * @returns Promise resolving to the recommendation if found, null otherwise
 */
export async function getRecommendationById(
  tableName: string,
  recommendationId: string
): Promise<Recommendation | null> {
  try {
    logger.info('Looking for recommendation by ID', {
      tableName,
      recommendationId,
    });

    // Configure scan parameters
    const params = {
      TableName: tableName,
      FilterExpression: 'recommendationId = :recommendationId',
      ExpressionAttributeValues: {
        ':recommendationId': recommendationId,
      },
    };

    // Execute scan
    const result = await docClient.send(new ScanCommand(params));

    if (result.Items && result.Items.length > 0) {
      logger.info('Found recommendation by ID', {
        recommendationId,
      });
      return result.Items[0] as Recommendation;
    }

    logger.info('No recommendation found with the given ID');
    return null;
  } catch (error) {
    logger.error('Error looking for recommendation by ID', { error });
    throw error;
  }
}

/**
 * Get recommendations that have been reviewed by Mario
 * 
 * @param tableName - DynamoDB table name
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export async function getReviewedRecommendations(
  tableName: string,
  limit = DEFAULT_LIMIT,
  startKey?: string,
): Promise<PaginationResult> {
  // Cap the limit at maximum
  const cappedLimit = Math.min(limit, MAX_LIMIT);

  // Create the scan parameters
  const params: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: 'reviewedByMario = :reviewedByMario',
    ExpressionAttributeValues: {
      ':reviewedByMario': true,
    },
    Limit: cappedLimit,
  };

  // Add starting key for pagination if provided
  if (startKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(startKey);
    } catch (error) {
      logger.error('Error parsing pagination token', { error });
      throw new Error('Invalid pagination token');
    }
  }

  try {
    logger.info('Scanning for reviewed recommendations', {
      tableName,
      limit: cappedLimit,
    });

    // Execute the scan command
    const result = await docClient.send(new ScanCommand(params));

    const items = result.Items || [];
    const lastEvaluatedKey = result.LastEvaluatedKey
      ? JSON.stringify(result.LastEvaluatedKey)
      : undefined;

    logger.info('Reviewed recommendations scan completed', {
      count: items.length,
      hasMore: !!lastEvaluatedKey,
    });

    return {
      items,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error scanning for reviewed recommendations', { error });
    throw error;
  }
}

/**
 * Get recommendations that have not been reviewed by Mario
 * 
 * @param tableName - DynamoDB table name
 * @param limit - Maximum number of items to return
 * @param startKey - Starting key for pagination
 * @returns Promise resolving to the paginated recommendations
 */
export async function getUnreviewedRecommendations(
  tableName: string,
  limit = DEFAULT_LIMIT,
  startKey?: string,
): Promise<PaginationResult> {
  // Cap the limit at maximum
  const cappedLimit = Math.min(limit, MAX_LIMIT);

  // Create the scan parameters
  const params: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: 'reviewedByMario = :reviewedByMario',
    ExpressionAttributeValues: {
      ':reviewedByMario': false,
    },
    Limit: cappedLimit,
  };

  // Add starting key for pagination if provided
  if (startKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(startKey);
    } catch (error) {
      logger.error('Error parsing pagination token', { error });
      throw new Error('Invalid pagination token');
    }
  }

  try {
    logger.info('Scanning for unreviewed recommendations', {
      tableName,
      limit: cappedLimit,
    });

    // Execute the scan command
    const result = await docClient.send(new ScanCommand(params));

    const items = result.Items || [];
    const lastEvaluatedKey = result.LastEvaluatedKey
      ? JSON.stringify(result.LastEvaluatedKey)
      : undefined;

    logger.info('Unreviewed recommendations scan completed', {
      count: items.length,
      hasMore: !!lastEvaluatedKey,
    });

    return {
      items,
      lastEvaluatedKey,
    };
  } catch (error) {
    logger.error('Error scanning for unreviewed recommendations', { error });
    throw error;
  }
}
