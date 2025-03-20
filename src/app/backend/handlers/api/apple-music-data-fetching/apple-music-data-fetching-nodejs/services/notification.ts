import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { TOKEN_REFRESH_SNS_TOPIC_ARN, APPLE_MUSIC_TOKEN_PARAM_NAME } from '../config';
import { logger } from './powertools';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const notificationService = {
    sendTokenRefreshNotification: async (): Promise<void> => {
        try {
            await snsClient.send(new PublishCommand({
                TopicArn: TOKEN_REFRESH_SNS_TOPIC_ARN,
                Subject: 'Apple Music API Token Refresh Required',
                Message: `The Apple Music User Token (MUT) has expired and needs to be refreshed. ` +
                    `Please update the token in the SSM Parameter Store: ${APPLE_MUSIC_TOKEN_PARAM_NAME}.\n\n` +
                    `You can do this by navigating to the Music Admin Panel at https://admin.music.mariolopez.org/`
            }));

            logger.info('Token refresh notification sent successfully');
        } catch (error) {
            logger.error('Error sending token refresh notification', { error });
        }
    },
}; 