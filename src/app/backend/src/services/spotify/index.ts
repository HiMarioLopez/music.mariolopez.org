import { Logger } from '@aws-lambda-powertools/logger';
import { Song } from '../../models/song';
import { fetchRecentlyPlayedTracks, getSpotifyAccessToken } from './api';
import { getParameter } from '../parameter';

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
 * Fetch recent songs from Spotify API
 *
 * @param accessToken - Spotify Access Token (optional, will fetch if not provided)
 * @param songLimitParameterName - Parameter name for song limit in SSM
 * @returns Promise resolving to an array of Song objects
 */
export const fetchRecentSongs = async (
  accessToken?: string,
  songLimitParameterName?: string
): Promise<Song[]> => {
  try {
    // Get access token if not provided
    if (!accessToken) {
      accessToken = await getSpotifyAccessToken();
    }

    // Get song limit from SSM if parameter name provided
    let limit = 25; // Default limit
    if (songLimitParameterName) {
      const songLimit = await getParameter(songLimitParameterName);
      if (songLimit) {
        limit = parseInt(songLimit, 10);
      } else {
        logger.warn('Song limit not found, using default value of 25');
      }
    }

    logger.info('Fetching recent songs from Spotify', { limit });

    // Fetch recently played tracks
    const songs = await fetchRecentlyPlayedTracks(limit, accessToken);

    logger.info('Successfully fetched songs', { count: songs.length });
    return songs;
  } catch (error) {
    logger.error('Error fetching songs from Spotify API', { error });
    throw error;
  }
};

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
