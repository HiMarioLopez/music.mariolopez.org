import { ReactNode, useCallback, useEffect, useState } from "react";
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

// Bright, vibrant color palettes - moved outside component to avoid recreation
const BRIGHT_PALETTES = [
  // Vibrant Purple/Pink/Blue
  ["#ff006e", "#8338ec", "#3a86ff", "#06ffa5", "#fb5607"],
  // Electric Cyan/Pink/Orange
  ["#ff006e", "#00f5ff", "#ffbe0b", "#fb5607", "#8338ec"],
  // Neon Green/Blue/Purple
  ["#06ffa5", "#00f5ff", "#8338ec", "#ff006e", "#ffbe0b"],
  // Hot Pink/Yellow/Blue
  ["#ff006e", "#ffbe0b", "#3a86ff", "#06ffa5", "#8338ec"],
  // Orange/Red/Cyan
  ["#fb5607", "#ff006e", "#00f5ff", "#8338ec", "#ffbe0b"],
  // Blue/Purple/Green
  ["#3a86ff", "#8338ec", "#06ffa5", "#ff006e", "#ffbe0b"],
];

export const MusicProvider = ({ children }: MusicProviderProps) => {
  const [nowPlaying, setNowPlaying] = useState<AppleMusicSong | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<AppleMusicSong[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize getBrightPalette to prevent recreation on every render
  const getBrightPalette = useCallback(
    (song: AppleMusicSong | null): string[] => {
      if (!song) {
        return BRIGHT_PALETTES[0];
      }
      // Use song ID to consistently pick a palette for the same song
      const paletteIndex =
        parseInt(song.id.slice(-1), 16) % BRIGHT_PALETTES.length;
      return BRIGHT_PALETTES[paletteIndex];
    },
    [],
  );

  const [gradientColors, setGradientColors] = useState<string[]>(
    () => BRIGHT_PALETTES[0],
  );

  const fetchMusicHistory = useCallback(
    async (getBrightPaletteFn = getBrightPalette) => {
      try {
        setLoading(true);
        setError(null);

        const processSongs = (
          items: AppleMusicSong[],
        ): (AppleMusicSong & { source: MusicSource })[] => {
          return items.map((item) => ({
            ...item,
            source: (item.source || "apple") as MusicSource,
          }));
        };

        const sortByMostRecent = (songs: AppleMusicSong[]) => {
          songs.sort((a, b) => {
            const timestampA = new Date(a.processedTimestamp).getTime();
            const timestampB = new Date(b.processedTimestamp).getTime();
            return timestampB - timestampA;
          });
        };

        const applySongsToState = (songs: AppleMusicSong[]) => {
          const allSongs = [...songs];
          sortByMostRecent(allSongs);

          if (allSongs.length > 0) {
            // TEMPORARY: Add mock source data for testing (if enabled)
            let processedItems = allSongs;
            if (ENABLE_MOCK_SOURCE_DATA) {
              processedItems = allSongs.map((item, index) => {
                // Alternate between apple, spotify, and no source for testing
                const sources: (MusicSource | undefined)[] = [
                  "apple",
                  "spotify",
                  undefined,
                ];
                return {
                  ...item,
                  source: sources[index % 3] || "apple",
                };
              });
            }

            setNowPlaying(processedItems[0]);
            setGradientColors(getBrightPaletteFn(processedItems[0]));
            setRecentlyPlayed(processedItems.slice(1));
          } else {
            setNowPlaying(null);
            setRecentlyPlayed([]);
          }
        };

        const applePromise = apiService.getMusicHistory(APPLE_MUSIC_LIMIT);
        const spotifyPromise = apiService.getSpotifyMusicHistory(SPOTIFY_LIMIT);

        // First response: render ASAP (don’t block UI on the slower source)
        const firstSettled = await Promise.race([
          applePromise.then((res) => ({ source: "apple" as const, res })),
          spotifyPromise.then((res) => ({ source: "spotify" as const, res })),
        ]);

        const firstSongs =
          firstSettled.source === "apple"
            ? processSongs(firstSettled.res.items)
            : processSongs(firstSettled.res.items);

        // Show what we have immediately
        applySongsToState(firstSongs);
        setLoading(false);

        // Then merge in the remaining source when it resolves
        const [appleSettled, spotifySettled] = await Promise.allSettled([
          applePromise,
          spotifyPromise,
        ]);

        const mergedSongs: AppleMusicSong[] = [];
        if (appleSettled.status === "fulfilled") {
          mergedSongs.push(...processSongs(appleSettled.value.items));
        }
        if (spotifySettled.status === "fulfilled") {
          mergedSongs.push(...processSongs(spotifySettled.value.items));
        }

        // If both failed, surface error + keep state as-is (skeletons will show if empty)
        if (mergedSongs.length === 0) {
          const appleErr =
            appleSettled.status === "rejected" ? appleSettled.reason : null;
          const spotifyErr =
            spotifySettled.status === "rejected" ? spotifySettled.reason : null;
          setError(
            (appleErr as Error | null)?.message ||
              (spotifyErr as Error | null)?.message ||
              "Failed to fetch music history",
          );
          return;
        }

        applySongsToState(mergedSongs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch music history",
        );
        console.error("Error fetching music history:", err);
      } finally {
        setLoading(false);
      }
    },
    [getBrightPalette],
  ); // Include getBrightPalette in dependencies

  // Fetch music history when the component mounts
  useEffect(() => {
    fetchMusicHistory();

    // Optional: Set up a refresh interval
    const intervalId = setInterval(() => {
      fetchMusicHistory();
    }, HISTORY_AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchMusicHistory]);

  // Update gradient colors when nowPlaying changes
  useEffect(() => {
    setGradientColors(getBrightPalette(nowPlaying));
  }, [nowPlaying, getBrightPalette]); // Include nowPlaying and getBrightPalette in dependencies

  const refreshMusicHistory = useCallback(async () => {
    await fetchMusicHistory();
  }, [fetchMusicHistory]);

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
