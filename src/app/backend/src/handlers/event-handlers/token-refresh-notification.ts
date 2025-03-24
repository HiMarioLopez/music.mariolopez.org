import { SNSEvent, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { sendEmail } from '../../services/email';

const logger = new Logger({ serviceName: 'token-refresh-notification' });
const tracer = new Tracer({ serviceName: 'token-refresh-notification' });
const metrics = new Metrics({ namespace: 'token-refresh-notification' });

/**
 * Lambda handler for processing token refresh notifications
 * Receives messages from SNS and sends email notifications to admin
 */
export const handler = async (event: SNSEvent, context: Context): Promise<void> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Token refresh notification event received', { recordCount: event.Records.length });
  metrics.addMetric('EventReceived', MetricUnit.Count, 1);

  try {
    // Get environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const sourceEmail = process.env.SOURCE_EMAIL;

    // Validate environment variables
    if (!adminEmail || !sourceEmail) {
      throw new Error(`Missing required environment variables: ${!adminEmail ? 'ADMIN_EMAIL' : ''} ${!sourceEmail ? 'SOURCE_EMAIL' : ''}`);
    }

    // Process each SNS record
    for (const record of event.Records) {
      const message = record.Sns.Message;
      const subject = record.Sns.Subject || 'Apple Music API Token Refresh Required';

      logger.info('Processing SNS message', {
        messageId: record.Sns.MessageId,
        subject
      });

      // Send email notification
      await sendEmail({
        to: adminEmail,
        from: sourceEmail,
        subject,
        body: message
      });

      metrics.addMetric('EmailSent', MetricUnit.Count, 1);
    }

    logger.info('Token refresh notification processing completed successfully');
  } catch (error) {
    logger.error('Error processing token refresh notification', { error });
    metrics.addMetric('ProcessingError', MetricUnit.Count, 1);
    throw error;
  }
};
