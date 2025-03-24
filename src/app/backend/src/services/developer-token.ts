import { Logger } from '@aws-lambda-powertools/logger';
import { getSecret } from './secret';
import { sign } from 'jsonwebtoken';

const logger = new Logger({ serviceName: 'developer-token-service' });

interface TokenConfig {
    APPLE_AUTH_KEY_SECRET_NAME: string;
    APPLE_TEAM_ID: string;
    APPLE_KEY_ID: string;
}

/**
 * Generate an Apple Music developer token using JWT
 * 
 * @param config - Configuration containing Apple credentials
 * @returns Promise resolving to the developer token
 * @throws Error if token generation fails
 */
export const generateDeveloperToken = async (config: TokenConfig): Promise<string> => {
    try {
        // Retrieve the private key from AWS Secrets Manager
        const applePrivateKey = await getSecret(config.APPLE_AUTH_KEY_SECRET_NAME);

        if (!applePrivateKey) {
            throw new Error('Failed to retrieve Apple private key');
        }

        // Ensure the private key is correctly formatted
        const privateKey = applePrivateKey
            .replace(/\\n/g, '\n')
            .replace(/^\s+|\s+$/g, '');

        // Generate JWT using the private key
        const token = sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '1h',
            issuer: config.APPLE_TEAM_ID,
            header: {
                alg: 'ES256',
                kid: config.APPLE_KEY_ID
            }
        });

        logger.info('Successfully generated developer token');
        return token;
    } catch (error) {
        logger.error('Error generating developer token', { error });
        throw error;
    }
};
