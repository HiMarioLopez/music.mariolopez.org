import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { EntityType } from '@models/recommendation';
import {
  getAllRecommendations,
  getRecommendationById,
  getRecommendationsByEntityType,
  getReviewedRecommendations,
  getUnreviewedRecommendations,
} from '@services/dynamodb/recommendations';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// Default limit for recommendation queries
const DEFAULT_LIMIT = 50;

/**
 * API Gateway handler function to fetch recommendations
 */
export const handler = wrapHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>({ serviceName: 'get-recommendations' }, async (event, context, utils) => {
  const rateLimitResponse = await checkRateLimit(event, {
    ...RATE_LIMITS.READ,
    logger: utils.logger,
    metrics: utils.metrics,
  });

  if (rateLimitResponse) {
    return rateLimitResponse as APIGatewayProxyResultV2;
  }

  // Get required environment variables
  const tableNameParameter = utils.getRequiredEnvVar(
    'DYNAMODB_TABLE_NAME_PARAMETER'
  );
  const tableIndexNameParameter = utils.getRequiredEnvVar(
    'DYNAMODB_TABLE_INDEX_NAME_PARAMETER'
  );

  // Get the table name from SSM Parameter Store
  const tableName = await utils.getRequiredParameter(tableNameParameter);

  // Try to get the index name, but use a hardcoded fallback if it fails
  let tableIndexName: string;
  try {
    tableIndexName = await utils.getRequiredParameter(
      tableIndexNameParameter,
      'EntityTypeVotesIndex' // Fallback value
    );
  } catch (error) {
    utils.logger.warn(
      `Error retrieving DynamoDB table index name, using fallback value`,
      { error }
    );
    tableIndexName = 'EntityTypeVotesIndex'; // Fallback value
  }

  // Get query parameters and parse pagination
  const { queryParams, limit, startKey } = utils.parseQueryParams(
    event,
    DEFAULT_LIMIT
  );

  // Get filters if provided
  const entityType = queryParams.entityType as EntityType | undefined;
  const recommendationId = queryParams.recommendationId;
  const reviewedByUser =
    queryParams.reviewedByUser !== undefined
      ? queryParams.reviewedByUser === 'true'
      : undefined;

  // Check if we're fetching a specific recommendation by ID
  if (recommendationId) {
    utils.logger.info('Fetching recommendation by ID', {
      recommendationId,
    });

    const recommendation = await getRecommendationById(
      tableName,
      recommendationId
    );

    if (!recommendation) {
      return utils.createErrorResponse(
        event,
        new Error(`Recommendation with ID ${recommendationId} not found`),
        HttpStatus.NOT_FOUND,
        `Recommendation with ID ${recommendationId} not found`
      );
    }

    utils.metrics.addMetric('RecommendationByIdQuery', MetricUnit.Count, 1);

    // Return the single recommendation
    return utils.createSuccessResponse(event, {
      item: recommendation,
    });
  }

  // Fetch recommendations from DynamoDB sorted by votes
  let result;

  // Determine which query function to use based on filters
  if (entityType) {
    // Validate entityType parameter
    if (!['SONG', 'ALBUM', 'ARTIST'].includes(entityType)) {
      return utils.createErrorResponse(
        event,
        new Error('Invalid entityType parameter'),
        HttpStatus.BAD_REQUEST,
        'Invalid entityType parameter. Must be one of: SONG, ALBUM, ARTIST'
      );
    }

    utils.logger.info(
      'Fetching recommendations by entityType, sorted by votes',
      {
        entityType,
        limit,
      }
    );
    result = await getRecommendationsByEntityType(
      tableName,
      tableIndexName,
      entityType,
      limit,
      startKey
    );
    utils.metrics.addMetric(
      'EntityTypeVotesFilteredQuery',
      MetricUnit.Count,
      1
    );
  } else if (reviewedByUser !== undefined) {
    // Filter by reviewedByUser status
    utils.logger.info('Fetching recommendations by reviewedByUser status', {
      reviewedByUser,
      limit,
    });

    if (reviewedByUser) {
      result = await getReviewedRecommendations(tableName, limit, startKey);
      utils.metrics.addMetric(
        'ReviewedRecommendationsQuery',
        MetricUnit.Count,
        1
      );
    } else {
      result = await getUnreviewedRecommendations(tableName, limit, startKey);
      utils.metrics.addMetric(
        'UnreviewedRecommendationsQuery',
        MetricUnit.Count,
        1
      );
    }
  } else {
    utils.logger.info('Fetching all recommendations sorted by votes', {
      limit,
    });
    result = await getAllRecommendations(tableName, limit, startKey);
    utils.metrics.addMetric(
      'AllRecommendationsByVotesQuery',
      MetricUnit.Count,
      1
    );
  }

  // Record the number of results returned
  utils.metrics.addMetric('ResultCount', MetricUnit.Count, result.items.length);

  // Format the paginated response using our utility
  const response = utils.formatPaginatedResponse(
    result.items,
    result.lastEvaluatedKey
  );

  utils.logger.info('Successfully returned recommendations', {
    count: result.items.length,
    hasMore: !!result.lastEvaluatedKey,
  });

  // Return recommendations as JSON response
  return utils.createSuccessResponse(event, response);
});
