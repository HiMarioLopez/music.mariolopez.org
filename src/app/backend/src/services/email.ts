import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const logger = new Logger({ serviceName: 'email-service' });
const tracer = new Tracer({ serviceName: 'email-service' });

const sesClient = new SESClient();

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(sesClient);

interface EmailParams {
    to: string;
    from: string;
    subject: string;
    body: string;
}

/**
 * Send an email notification using Amazon SES
 * 
 * @param params - Email parameters including to, from, subject, and body
 * @returns Promise resolving when email is sent
 */
export const sendEmail = async (params: EmailParams): Promise<void> => {
    try {
        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: [params.to]
            },
            Message: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: params.body
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: params.subject
                }
            },
            Source: params.from
        });

        await sesClient.send(command);
        logger.info('Email notification sent successfully', { 
            recipient: params.to,
            subject: params.subject
        });
    } catch (error) {
        logger.error('Error sending email notification', { 
            error, 
            recipient: params.to,
            subject: params.subject
        });
        throw error;
    }
};
