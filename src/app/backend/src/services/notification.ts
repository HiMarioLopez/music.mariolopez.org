import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const logger = new Logger({ serviceName: 'notification-service' });
const tracer = new Tracer({ serviceName: 'notification-service' });
const snsClient = new SNSClient();

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(snsClient);

/**
 * Send a notification to the token refresh SNS topic
 * 
 * @param message - The message to send
 * @param subject - Optional subject for the notification
 * @returns Promise resolving to the message ID
 */
export const sendTokenRefreshNotification = async (
  message = 'Apple Music API token refresh required',
  subject = 'Apple Music API Token Refresh Required'
): Promise<string> => {
  try {
    const topicArn = process.env.TOKEN_REFRESH_TOPIC_ARN;
    if (!topicArn) {
      throw new Error('Missing required environment variable: TOKEN_REFRESH_TOPIC_ARN');
    }

    const result = await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      Subject: subject
    }));

    logger.info('Successfully sent token refresh notification', {
      messageId: result.MessageId,
      topicArn
    });

    return result.MessageId || '';
  } catch (error) {
    logger.error('Failed to send token refresh notification', { error });
    throw new Error('Failed to send token refresh notification');
  }
};
