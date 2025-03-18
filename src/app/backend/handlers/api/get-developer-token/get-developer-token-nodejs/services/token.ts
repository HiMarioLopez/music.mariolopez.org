import { sign } from 'jsonwebtoken';
import { secretsProvider, logger } from './powertools';

interface TokenConfig {
    APPLE_AUTH_KEY_SECRET_NAME: string;
    APPLE_TEAM_ID: string;
    APPLE_KEY_ID: string;
}

export const generateDeveloperToken = async (config: TokenConfig): Promise<string> => {
    const applePrivateKey = await secretsProvider.get(config.APPLE_AUTH_KEY_SECRET_NAME);

    if (!applePrivateKey || typeof applePrivateKey !== 'string') {
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
}; 