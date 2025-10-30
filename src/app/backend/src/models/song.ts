// Music source type for union types
export type MusicSource = 'apple' | 'spotify';

// Base interface with common fields
export interface BaseSong {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  processedTimestamp: string;
  source: MusicSource;
  artworkUrl?: string;
  url?: string;
}

/**
 * Represents a music song from Apple Music
 */
export interface AppleMusicSong extends BaseSong {
  source: 'apple';
  // Apple Music specific fields
  genreNames?: string[];
  trackNumber?: number;
  durationInMillis?: number;
  releaseDate?: string;
  isrc?: string;
  composerName?: string;
  hasLyrics?: boolean;
  isAppleDigitalMaster?: boolean;
  artworkColors?: {
    backgroundColor: string;
    textColor1: string;
    textColor2: string;
    textColor3: string;
    textColor4: string;
  };
}

/**
 * Represents a music song from Spotify
 */
export interface SpotifySong extends BaseSong {
  source: 'spotify';
  // Spotify specific fields
  spotifyId: string;
  spotifyUrl: string;
  durationMs: number;
  popularity?: number;
  previewUrl?: string;
  externalUrls: {
    spotify: string;
  };
  // Additional Spotify-specific metadata
  albumId?: string;
  artistId?: string;
  discNumber?: number;
  trackNumber?: number;
  isLocal?: boolean;
  isExplicit?: boolean;
}

// Union type for all songs
export type Song = AppleMusicSong | SpotifySong;

/**
 * Type guard to check if a song is from Apple Music
 */
export const isAppleMusicSong = (song: Song): song is AppleMusicSong => {
  return song.source === 'apple';
};

/**
 * Type guard to check if a song is from Spotify
 */
export const isSpotifySong = (song: Song): song is SpotifySong => {
  return song.source === 'spotify';
};

/**
 * Get the appropriate URL for a song based on its source
 */
export const getSongUrl = (song: Song): string | undefined => {
  if (isAppleMusicSong(song)) {
    return song.url;
  }
  if (isSpotifySong(song)) {
    return song.spotifyUrl;
  }
  return undefined;
};

/**
 * Get the duration in milliseconds regardless of source
 */
export const getDurationMs = (song: Song): number | undefined => {
  if (isAppleMusicSong(song)) {
    return song.durationInMillis;
  }
  if (isSpotifySong(song)) {
    return song.durationMs;
  }
  return undefined;
};
