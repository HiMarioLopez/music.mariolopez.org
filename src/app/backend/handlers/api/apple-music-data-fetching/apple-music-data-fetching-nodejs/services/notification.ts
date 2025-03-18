import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TOKEN_REFRESH_SNS_TOPIC_ARN, FAILED_REQUESTS_SQS_URL, APPLE_MUSIC_TOKEN_PARAM_NAME } from '../config';
import { logger } from './powertools';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const notificationService = {
    sendTokenRefreshNotification: async (): Promise<void> => {
        try {
            await snsClient.send(new PublishCommand({
                TopicArn: TOKEN_REFRESH_SNS_TOPIC_ARN,
                Subject: 'Apple Music API Token Refresh Required',
                Message: `The Apple Music API token has expired and needs to be refreshed. Please update the token in the SSM Parameter Store: ${APPLE_MUSIC_TOKEN_PARAM_NAME}`
            }));

            logger.info('Token refresh notification sent successfully');
        } catch (error) {
            logger.error('Error sending token refresh notification', { error });
        }
    },

    queueFailedRequest: async (event: APIGatewayProxyEvent): Promise<void> => {
        try {
            await sqsClient.send(new SendMessageCommand({
                QueueUrl: FAILED_REQUESTS_SQS_URL,
                MessageBody: JSON.stringify(event),
                DelaySeconds: 900
            }));

            logger.info('Failed request queued for retry');
        } catch (error) {
            logger.error('Error queuing failed request', { error });
        }
    }
}; 