import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getParameter } from '../../../services/parameter';
import { getCorsHeaders } from '../../../utils/cors';

const logger = new Logger({ serviceName: 'review-recommendation' });
const tracer = new Tracer({ serviceName: 'review-recommendation' });
const metrics = new Metrics({ namespace: 'review-recommendation' });

// Initialize DynamoDB client
const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(dynamodbClient);
tracer.captureAWSv3Client(docClient);

/**
 * API Gateway handler function to review and update moderation status for a recommendation
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Review Recommendation Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_TABLE_NAME_PARAMETER'
      );
    }

    const adminApiKey = process.env.ADMIN_API_KEY;
    if (!adminApiKey) {
      throw new Error(
        'Missing required environment variable: ADMIN_API_KEY'
      );
    }

    // Get DynamoDB table name from Parameter Store
    logger.info('Retrieving table name from parameter', { tableNameParameter });
    const tableName = await getParameter(tableNameParameter);

    if (!tableName) {
      throw new Error(
        `Failed to retrieve DynamoDB table name from parameter: ${tableNameParameter}`
      );
    }

    // Verify admin API key
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
      logger.warn('Unauthorized access attempt', { 
        authHeader: authHeader ? 'present' : 'missing',
        clientIp: event.requestContext.http.sourceIp 
      });
      return {
        statusCode: 403,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Unauthorized: Invalid or missing admin API key',
        }),
      };
    }

    // Parse the request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Request body is required',
        }),
      };
    }

    const requestBody = JSON.parse(event.body);

    // Validate required fields
    if (!requestBody.entityType || !requestBody.timestamp || !requestBody.moderationStatus) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: 'Missing required fields (entityType, timestamp, and moderationStatus are required)',
        }),
      };
    }

    // Validate moderationStatus value
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(requestBody.moderationStatus)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
        body: JSON.stringify({
          message: `Invalid moderationStatus value. Must be one of: ${validStatuses.join(', ')}`,
        }),
      };
    }

    // Prepare reviewer information
    const reviewerInfo = {
      reviewedBy: requestBody.reviewedBy || 'admin',
      reviewedTimestamp: new Date().toISOString(),
    };

    // Update the recommendation's moderation status
    const updateParams = {
      TableName: tableName,
      Key: {
        entityType: requestBody.entityType,
        timestamp: requestBody.timestamp,
      },
      UpdateExpression: 'SET moderationStatus = :status, moderationDetails.reviewedBy = :reviewedBy, moderationDetails.reviewedTimestamp = :reviewedTimestamp',
      ExpressionAttributeValues: {
        ':status': requestBody.moderationStatus,
        ':reviewedBy': reviewerInfo.reviewedBy,
        ':reviewedTimestamp': reviewerInfo.reviewedTimestamp,
      },
      ReturnValues: 'ALL_NEW' as const,
    };

    logger.info('Updating recommendation moderation status', {
      entityType: requestBody.entityType,
      timestamp: requestBody.timestamp,
      newStatus: requestBody.moderationStatus,
      reviewer: reviewerInfo.reviewedBy,
    });

    const result = await docClient.send(new UpdateCommand(updateParams));

    // Track metric for moderation decision
    metrics.addMetric(
      `Recommendation${requestBody.moderationStatus.charAt(0).toUpperCase() + requestBody.moderationStatus.slice(1)}Count`,
      MetricUnit.Count,
      1
    );

    logger.info('Successfully updated recommendation moderation status', {
      status: requestBody.moderationStatus,
    });

    // Return success response
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: `Recommendation moderation status updated to ${requestBody.moderationStatus}`,
        updatedRecommendation: result.Attributes,
        moderationStatus: requestBody.moderationStatus,
      }),
    };
  } catch (error) {
    logger.error('Error updating recommendation moderation status', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers?.origin, 'POST,OPTIONS'),
      body: JSON.stringify({
        message: 'Failed to update recommendation moderation status',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
