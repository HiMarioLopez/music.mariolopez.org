import axios from 'axios';
import { APPLE_MUSIC_API_BASE_URL, APPLE_MUSIC_TOKEN_PARAM_NAME } from '../config';
import { logger, parameters } from './powertools';

export const appleMusicService = {
    getMusicUserToken: async (): Promise<string> => {
        try {
            const musicUserToken = await parameters.get(APPLE_MUSIC_TOKEN_PARAM_NAME, {
                decrypt: true,
                maxAge: 5 * 60,
            });

            if (!musicUserToken) {
                throw new Error('Music User Token parameter is empty or undefined');
            }

            return musicUserToken;
        } catch (error) {
            logger.error('Error fetching Music User Token', { error });
            throw error;
        }
    },

    fetchFromApi: async (path: string, developerToken: string, musicUserToken: string): Promise<any> => {
        try {
            const apiPath = path.replace(/^\/(?:api\/)?(?:nodejs\/)?(?:apple-music\/)?/, '');
            logger.info(`Calling Apple Music API with path: ${apiPath}`);

            const response = await axios.get(`${APPLE_MUSIC_API_BASE_URL}/${apiPath}`, {
                headers: {
                    'Authorization': `Bearer ${developerToken}`,
                    'Music-User-Token': musicUserToken,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error: any) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                error.isTokenExpired = true;
            }
            throw error;
        }
    },

    isTokenExpirationError: (error: any): boolean => {
        return error.isTokenExpired ||
            (error.response && (error.response.status === 401 || error.response.status === 403));
    }
}; 