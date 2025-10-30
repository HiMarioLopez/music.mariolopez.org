import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const logger = new Logger({ serviceName: 'secret-service' });
const tracer = new Tracer({ serviceName: 'secret-service' });

const secretsClient = new SecretsManagerClient();

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(secretsClient);

/**
 * Get a secret from AWS Secrets Manager
 * 
 * @param secretName - Name of the secret to retrieve
 * @returns Promise resolving to the secret value
 * @throws Error if the secret cannot be retrieved
 */
export const getSecret = async (secretName: string): Promise<string> => {
    try {
        const response = await secretsClient.send(
            new GetSecretValueCommand({
                SecretId: secretName
            })
        );

        if (!response.SecretString) {
            throw new Error(`Secret ${secretName} has no value`);
        }

        logger.info('Successfully retrieved secret', {
            secretName,
            hasValue: !!response.SecretString
        });

        return response.SecretString;
    } catch (error) {
        logger.error('Failed to retrieve secret', { secretName, error });
        throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
};

/**
 * Get a JSON secret from AWS Secrets Manager and parse it
 * 
 * @param secretName - Name of the secret to retrieve
 * @returns Promise resolving to the parsed JSON object
 * @throws Error if the secret cannot be retrieved or parsed
 */
export const getSecretJson = async <T = Record<string, any>>(
    secretName: string
): Promise<T> => {
    try {
        const secretString = await getSecret(secretName);
        const parsed = JSON.parse(secretString) as T;
        
        logger.info('Successfully retrieved and parsed JSON secret', {
            secretName,
            hasValue: !!parsed
        });

        return parsed;
    } catch (error) {
        logger.error('Failed to retrieve or parse JSON secret', { secretName, error });
        throw new Error(`Failed to retrieve or parse JSON secret: ${secretName}`);
    }
};
