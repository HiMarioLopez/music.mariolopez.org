import { ReactNode, useEffect, useState } from "react";
import { MusicContext } from "../context/MusicContext";
import { AppleMusicSong } from "../models/AppleMusicSong";
import { apiService } from "../services/apiService";
import { MusicSource } from "../types/MusicSource";

interface MusicProviderProps {
  children: ReactNode;
}

const HISTORY_AUTO_REFRESH_INTERVAL = 60000; // Refresh every minute
const APPLE_MUSIC_LIMIT = 15; // Songs from Apple Music
const SPOTIFY_LIMIT = 15; // Songs from Spotify

// TEMPORARY: Enable mock source data for testing indicators
// Set to false once backend provides real source data
const ENABLE_MOCK_SOURCE_DATA = false;

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [nowPlaying, setNowPlaying] = useState<AppleMusicSong | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<AppleMusicSong[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Bright, vibrant color palettes
  const BRIGHT_PALETTES = [
    // Vibrant Purple/Pink/Blue
    ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#fb5607'],
    // Electric Cyan/Pink/Orange
    ['#ff006e', '#00f5ff', '#ffbe0b', '#fb5607', '#8338ec'],
    // Neon Green/Blue/Purple
    ['#06ffa5', '#00f5ff', '#8338ec', '#ff006e', '#ffbe0b'],
    // Hot Pink/Yellow/Blue
    ['#ff006e', '#ffbe0b', '#3a86ff', '#06ffa5', '#8338ec'],
    // Orange/Red/Cyan
    ['#fb5607', '#ff006e', '#00f5ff', '#8338ec', '#ffbe0b'],
    // Blue/Purple/Green
    ['#3a86ff', '#8338ec', '#06ffa5', '#ff006e', '#ffbe0b'],
  ];

  // Select a palette based on song ID for consistency, or rotate
  const getBrightPalette = (song: AppleMusicSong | null): string[] => {
    if (!song) {
      return BRIGHT_PALETTES[0];
    }
    // Use song ID to consistently pick a palette for the same song
    const paletteIndex = parseInt(song.id.slice(-1), 16) % BRIGHT_PALETTES.length;
    return BRIGHT_PALETTES[paletteIndex];
  };

  const [gradientColors, setGradientColors] = useState<string[]>(() =>
    BRIGHT_PALETTES[0]
  );

  const fetchMusicHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both endpoints in parallel
      const [appleMusicResponse, spotifyResponse] = await Promise.all([
        apiService.getMusicHistory(APPLE_MUSIC_LIMIT),
        apiService.getSpotifyMusicHistory(SPOTIFY_LIMIT),
      ]);

      // Process Apple Music songs - ensure source is set to 'apple' if not specified
      const appleMusicSongs = appleMusicResponse.items.map((item) => ({
        ...item,
        source: (item.source || 'apple') as MusicSource,
      }));

      // Process Spotify songs - default to 'apple' if no source, but preserve 'spotify' if set
      const spotifySongs = spotifyResponse.items.map((item) => ({
        ...item,
        source: (item.source || 'apple') as MusicSource,
      }));

      // Merge both arrays
      const allSongs = [...appleMusicSongs, ...spotifySongs];

      // Sort by processedTimestamp (most recent first)
      allSongs.sort((a, b) => {
        const timestampA = new Date(a.processedTimestamp).getTime();
        const timestampB = new Date(b.processedTimestamp).getTime();
        return timestampB - timestampA;
      });

      if (allSongs.length > 0) {
        // TEMPORARY: Add mock source data for testing (if enabled)
        let processedItems = allSongs;
        if (ENABLE_MOCK_SOURCE_DATA) {
          processedItems = allSongs.map((item, index) => {
            // Alternate between apple, spotify, and no source for testing
            const sources: (MusicSource | undefined)[] = ['apple', 'spotify', undefined];
            return {
              ...item,
              source: sources[index % 3] || 'apple',
            };
          });
        }

        // Set the first (most recent) item as now playing
        setNowPlaying(processedItems[0]);

        // Update gradient colors based on the now playing song
        setGradientColors(getBrightPalette(processedItems[0]));

        // Set the rest as recently played (remaining songs after now playing)
        setRecentlyPlayed(processedItems.slice(1));
      } else {
        setNowPlaying(null);
        setRecentlyPlayed([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch music history",
      );
      console.error("Error fetching music history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch music history when the component mounts
  useEffect(() => {
    fetchMusicHistory();

    // Optional: Set up a refresh interval
    const intervalId = setInterval(() => {
      fetchMusicHistory();
    }, HISTORY_AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Update gradient colors when nowPlaying changes
  useEffect(() => {
    setGradientColors(getBrightPalette(nowPlaying));
  }, [nowPlaying?.id]); // Track by song ID to update when song changes

  const refreshMusicHistory = async () => {
    await fetchMusicHistory();
  };

  const value = {
    nowPlaying,
    recentlyPlayed,
    loading,
    error,
    refreshMusicHistory,
    gradientColors,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};
