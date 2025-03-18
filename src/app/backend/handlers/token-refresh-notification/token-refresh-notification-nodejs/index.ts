import { SNSEvent } from 'aws-lambda';
import {
    SESClient,
    SendEmailCommand
} from '@aws-sdk/client-ses';

// Constants
const ADMIN_EMAIL = process.env!.ADMIN_EMAIL!;
const SOURCE_EMAIL = process.env!.SOURCE_EMAIL!;

// SES client initialization
const sesClient = new SESClient({ region: process.env!.AWS_REGION! });

/**
 * Lambda handler for processing token refresh notifications
 * Receives messages from SNS and sends email notifications to admin
 */
export const handler = async (event: SNSEvent): Promise<void> => {
    try {
        console.log('Token refresh notification event received:', JSON.stringify(event));

        for (const record of event.Records) {
            const message = record.Sns.Message;
            const subject = record.Sns.Subject || 'Apple Music API Token Refresh Required';

            console.log(`Processing SNS message: ${message}`);

            // Send email notification
            await sendEmailNotification(subject, message);
        }

        console.log('Token refresh notification processing completed');
    } catch (error) {
        console.error('Error processing token refresh notification:', error);
        throw error;
    }
};

/**
 * Send email notification to admin
 */
async function sendEmailNotification(subject: string, message: string): Promise<void> {
    try {
        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: [ADMIN_EMAIL]
            },
            Message: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject
                }
            },
            Source: SOURCE_EMAIL
        });

        await sesClient.send(command);
        console.log(`Email notification sent to ${ADMIN_EMAIL}`);
    } catch (error) {
        console.error('Error sending email notification:', error);
        throw error;
    }
} 