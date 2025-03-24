import axios from 'axios';
import { Logger } from '@aws-lambda-powertools/logger';
import { Track } from '../../models/track';
import { getParameter } from '../parameter';

const logger = new Logger({ serviceName: 'apple-music-service' });

/**
 * Fetch developer token from auth endpoint
 * 
 * @returns Promise resolving to the developer token
 */
export const getDeveloperToken = async (): Promise<string> => {
    try {
        const response = await axios.get('https://music.mariolopez.org/api/nodejs/auth/token', {
            timeout: 5000
        });

        if (!response.data?.token) {
            throw new Error('Invalid token response format');
        }

        logger.info('Successfully retrieved developer token');
        return response.data.token;
    } catch (error) {
        logger.error('Error fetching developer token', { error });
        if (axios.isAxiosError(error)) {
            logger.error('Axios error details', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }
        throw new Error('Failed to retrieve developer token');
    }
};

/**
 * Fetch recent tracks from Apple Music API
 * 
 * @param musicUserToken - Apple Music User Token
 * @param trackLimitParameterName - Parameter name for track limit in SSM
 * @returns Promise resolving to an array of Track objects
 */
export const fetchRecentTracks = async (
    musicUserToken: string,
    trackLimitParameterName: string
): Promise<Track[]> => {
    try {
        // Get developer token first
        const developerToken = await getDeveloperToken();

        // Get track limit from SSM
        const trackLimit = await getParameter(trackLimitParameterName);
        if (!trackLimit) {
            logger.warn('Track limit not found, using default value of 25');
        }
        const limit = trackLimit ? parseInt(trackLimit, 10) : 25;

        const apiUrl = 'https://music.mariolopez.org/api/nodejs/apple-music/me/recent/played/tracks';
        logger.info('Fetching recent tracks', { limit });

        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${developerToken}`,
                'Music-User-Token': musicUserToken
            },
            params: { limit },
            timeout: 10000
        });

        // Update validation to handle the actual response structure
        if (!response.data?.data?.data || !Array.isArray(response.data.data.data)) {
            logger.error('Invalid response structure from Apple Music API', {
                response: JSON.stringify(response.data)
            });
            return [];
        }

        const tracks = response.data.data.data
            .map((track: any) => {
                try {
                    const { attributes, id } = track;

                    if (!id || !attributes) {
                        logger.warn('Track missing required properties', {
                            track: JSON.stringify(track)
                        });
                        return null;
                    }

                    return {
                        id,
                        artistName: attributes.artistName || 'Unknown Artist',
                        name: attributes.name || 'Unknown Track',
                        albumName: attributes.albumName || 'Unknown Album',
                        genreNames: attributes.genreNames,
                        trackNumber: attributes.trackNumber,
                        durationInMillis: attributes.durationInMillis,
                        releaseDate: attributes.releaseDate,
                        isrc: attributes.isrc,
                        artworkUrl: attributes.artwork?.url,
                        composerName: attributes.composerName,
                        url: attributes.url,
                        hasLyrics: attributes.hasLyrics,
                        isAppleDigitalMaster: attributes.isAppleDigitalMaster,
                        processedTimestamp: new Date().toISOString(),
                        artworkColors: attributes.artwork ? {
                            backgroundColor: `#${attributes.artwork.bgColor}`,
                            textColor1: `#${attributes.artwork.textColor1}`,
                            textColor2: `#${attributes.artwork.textColor2}`,
                            textColor3: `#${attributes.artwork.textColor3}`,
                            textColor4: `#${attributes.artwork.textColor4}`
                        } : undefined
                    };
                } catch (err) {
                    logger.warn('Error processing track', { error: err });
                    return null;
                }
            })
            .filter(Boolean) as Track[];

        logger.info('Successfully fetched tracks', { count: tracks.length });
        return tracks;
    } catch (error) {
        logger.error('Error fetching tracks from Apple Music API', { error });

        // Enhanced error logging for network errors
        if (axios.isAxiosError(error)) {
            logger.error('Axios error details', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
        }

        throw error;
    }
};

/**
 * Process tracks and filter out already processed ones
 * 
 * @param tracks - Array of Track objects
 * @param lastProcessedTrackId - ID of the last processed track
 * @returns Promise resolving to filtered array of Track objects
 */
export const processTracks = async (
    tracks: Track[],
    lastProcessedTrackId: string
): Promise<Track[]> => {
    // If no last processed track ID, return all tracks
    if (!lastProcessedTrackId) {
        logger.info('No last processed track ID, returning all tracks');
        return tracks;
    }

    // Find index of the last processed track
    const lastProcessedIndex = tracks.findIndex(track => track.id === lastProcessedTrackId);

    // If not found, return all tracks
    if (lastProcessedIndex === -1) {
        logger.info('Last processed track not found in recent tracks, returning all tracks');
        return tracks;
    }

    // Return only tracks newer than the last processed track
    const newTracks = tracks.slice(0, lastProcessedIndex);
    logger.info('Filtered tracks', {
        total: tracks.length,
        new: newTracks.length,
        lastProcessedTrackId
    });

    return newTracks;
};
