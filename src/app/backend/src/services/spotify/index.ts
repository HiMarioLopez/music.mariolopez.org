import { Logger } from '@aws-lambda-powertools/logger';
import { Song } from '../../models/song';

const logger = new Logger({ serviceName: 'spotify-service' });

// Re-export core API functions
export {
  exchangeCodeForToken,
  fetchRecentlyPlayedTracks,
  generateSpotifyAuthUrl,
  getSpotifyAccessToken,
  getSpotifyConfig,
  makeSpotifyApiRequest,
  refreshSpotifyAccessToken,
  type SpotifyConfig,
  type SpotifyRecentlyPlayedResponse,
  type SpotifyRefreshTokenResponse,
  type SpotifyTokenResponse,
  type SpotifyTrack,
} from './api';

/**
 * Process Spotify songs and filter out already processed ones
 *
 * @param songs - Array of Song objects
 * @param lastProcessedSongId - ID of the last processed song
 * @returns Promise resolving to filtered array of Song objects
 */
export const processSongs = async (
  songs: Song[],
  lastProcessedSongId: string
): Promise<Song[]> => {
  // If no last processed song ID, return all songs
  if (!lastProcessedSongId || lastProcessedSongId === 'placeholder') {
    logger.info('No last processed song ID, returning all songs');
    return songs;
  }

  // Find index of the last processed song
  const lastProcessedIndex = songs.findIndex(
    (song) => song.id === lastProcessedSongId
  );

  // If not found, return all songs
  if (lastProcessedIndex === -1) {
    logger.info(
      'Last processed song not found in recent songs, returning all songs'
    );
    return songs;
  }

  // Return only songs newer than the last processed song
  const newSongs = songs.slice(0, lastProcessedIndex);
  logger.info('Filtered Spotify songs', {
    total: songs.length,
    new: newSongs.length,
    lastProcessedSongId,
  });

  return newSongs;
};
