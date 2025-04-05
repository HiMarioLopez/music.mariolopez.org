import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getParameter } from '../../services/parameter';

const logger = new Logger({ serviceName: 'check-pending-moderations' });
const tracer = new Tracer({ serviceName: 'check-pending-moderations' });
const metrics = new Metrics({ namespace: 'check-pending-moderations' });

// Initialize DynamoDB client
const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Initialize SES client
const sesClient = new SESClient();

// Instrument AWS clients with tracer
tracer.captureAWSv3Client(dynamodbClient);
tracer.captureAWSv3Client(docClient);
tracer.captureAWSv3Client(sesClient);

/**
 * Scheduled Lambda function to check for pending moderation items and send notification emails
 */
export const handler = async (event: any, context: Context): Promise<void> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Check Pending Moderations Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const tableNameParameter = process.env.DYNAMODB_TABLE_NAME_PARAMETER;
    if (!tableNameParameter) {
      throw new Error(
        'Missing required environment variable: DYNAMODB_TABLE_NAME_PARAMETER'
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('Missing required environment variable: ADMIN_EMAIL');
    }

    const sourceEmail = process.env.SOURCE_EMAIL;
    if (!sourceEmail) {
      throw new Error('Missing required environment variable: SOURCE_EMAIL');
    }

    // Get DynamoDB table name from Parameter Store
    logger.info('Retrieving table name from parameter', { tableNameParameter });
    const tableName = await getParameter(tableNameParameter);

    if (!tableName) {
      throw new Error(
        `Failed to retrieve DynamoDB table name from parameter: ${tableNameParameter}`
      );
    }

    // We need to query for each entity type (SONG, ALBUM, ARTIST) separately
    // and combine the results because we're querying by the primary key
    const entityTypes = ['SONG', 'ALBUM', 'ARTIST'];
    let pendingItems: any[] = [];

    for (const entityType of entityTypes) {
      // Create query parameters
      const queryParams = {
        TableName: tableName,
        KeyConditionExpression: 'entityType = :entityType',
        FilterExpression: 'moderationStatus = :pendingStatus',
        ExpressionAttributeValues: {
          ':entityType': entityType,
          ':pendingStatus': 'pending_review',
        },
      };

      logger.info('Querying for pending moderation items', {
        entityType,
        tableName,
      });

      // Execute query
      const result = await docClient.send(new QueryCommand(queryParams));
      
      // Add results to our collection
      if (result.Items && result.Items.length > 0) {
        pendingItems = [...pendingItems, ...result.Items];
      }
    }

    // If no pending items, log and exit
    if (pendingItems.length === 0) {
      logger.info('No pending moderation items found');
      metrics.addMetric('EmptyCheckCount', MetricUnit.Count, 1);
      return;
    }

    // Log the number of pending items
    logger.info('Found pending moderation items', {
      count: pendingItems.length,
    });
    metrics.addMetric('PendingItemsCount', MetricUnit.Count, pendingItems.length);

    // Format items for the email
    const formattedItems = pendingItems.map((item, index) => {
      // Determine what kind of recommendation it is and extract relevant fields
      let title = '';
      let subtitle = '';

      if (item.entityType === 'SONG') {
        title = item.songTitle || 'Unknown Song';
        subtitle = `by ${item.artistName || 'Unknown Artist'} on ${
          item.albumName || 'Unknown Album'
        }`;
      } else if (item.entityType === 'ALBUM') {
        title = item.albumTitle || 'Unknown Album';
        subtitle = `by ${item.artistName || 'Unknown Artist'}`;
      } else if (item.entityType === 'ARTIST') {
        title = item.artistName || 'Unknown Artist';
        subtitle = `Artist recommendation`;
      }

      // Get flagged categories if available
      const flaggedCategories = item.moderationDetails?.flaggedCategories || [];
      const flags = flaggedCategories.length > 0
        ? `Flagged for: ${flaggedCategories.join(', ')}`
        : 'No specific flags';

      // Get notes
      const notes = Array.isArray(item.notes)
        ? item.notes.map((note: any) => `${note.from}: "${note.note}"`).join('\n')
        : 'No notes';

      return `
Item ${index + 1}:
Type: ${item.entityType}
Title: ${title}
${subtitle}
${flags}
Notes:
${notes}
Flagged at: ${item.moderationDetails?.flaggedTimestamp || 'Unknown time'}
`;
    }).join('\n--------------------\n');

    // Create the email content
    const emailParams = {
      Destination: {
        ToAddresses: [adminEmail],
      },
      Message: {
        Body: {
          Text: {
            Data: `Hello Admin,

You have ${pendingItems.length} recommendation(s) pending moderation review on music.mariolopez.org.

Details:
${formattedItems}

Please visit the admin panel to review these items.

Thank you,
Music Recommendations System
`,
          },
        },
        Subject: {
          Data: `[Action Required] ${pendingItems.length} Recommendation(s) Pending Moderation`,
        },
      },
      Source: sourceEmail,
    };

    // Send the email
    logger.info('Sending notification email', {
      to: adminEmail,
      from: sourceEmail,
      itemCount: pendingItems.length,
    });

    await sesClient.send(new SendEmailCommand(emailParams));
    metrics.addMetric('EmailSentCount', MetricUnit.Count, 1);

    logger.info('Notification email sent successfully');
  } catch (error) {
    logger.error('Error checking pending moderations', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);
    throw error;
  }
};
