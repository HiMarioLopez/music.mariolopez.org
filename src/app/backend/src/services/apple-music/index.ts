import { Logger } from '@aws-lambda-powertools/logger';
import { Track } from '../../models/track';

const logger = new Logger({ serviceName: 'apple-music-service' });

// Re-export core API functions for backward compatibility
export {
    fetchFromApi,
    fetchRecentTracks, getDeveloperToken,
    getMusicUserToken
} from './api';

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
