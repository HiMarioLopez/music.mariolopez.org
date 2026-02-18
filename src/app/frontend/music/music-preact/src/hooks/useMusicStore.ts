import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import type { AppleMusicSong } from "../models/AppleMusicSong";
import { apiService } from "../services/apiService";
import type { MusicSource } from "../types/MusicSource";

const HISTORY_AUTO_REFRESH_INTERVAL = 60000;
const APPLE_MUSIC_LIMIT = 15;
const SPOTIFY_LIMIT = 15;

const BRIGHT_PALETTES = [
  ["#42b883", "#35495e", "#41d1ff", "#2f495e", "#6ee7b7"],
  ["#4fc08d", "#2f495e", "#22d3ee", "#334155", "#10b981"],
  ["#5eead4", "#42b883", "#1e3a8a", "#2f495e", "#22c55e"],
  ["#34d399", "#0ea5e9", "#42b883", "#1f2937", "#67e8f9"],
  ["#10b981", "#3b82f6", "#2f495e", "#14b8a6", "#86efac"],
  ["#42b883", "#0891b2", "#0f766e", "#334155", "#22d3ee"],
];

export interface MusicStoreState {
  nowPlaying: AppleMusicSong | null;
  recentlyPlayed: AppleMusicSong[];
  loading: boolean;
  error: string | null;
  gradientColors: string[];
  refreshMusicHistory: () => Promise<void>;
}

const getBrightPalette = (song: AppleMusicSong | null): string[] => {
  if (!song) {
    return BRIGHT_PALETTES[0];
  }

  const parsed = Number.parseInt(song.id.slice(-1), 16);
  const paletteIndex =
    Number.isNaN(parsed) || parsed < 0 ? 0 : parsed % BRIGHT_PALETTES.length;
  return BRIGHT_PALETTES[paletteIndex];
};

export const useMusicStore = (): MusicStoreState => {
  const [nowPlaying, setNowPlaying] = useState<AppleMusicSong | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<AppleMusicSong[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gradientColors, setGradientColors] = useState<string[]>(BRIGHT_PALETTES[0]);

  const fetchMusicHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [appleMusicResponse, spotifyResponse] = await Promise.all([
        apiService.getMusicHistory(APPLE_MUSIC_LIMIT),
        apiService.getSpotifyMusicHistory(SPOTIFY_LIMIT),
      ]);

      const appleMusicSongs = appleMusicResponse.items.map((item) => ({
        ...item,
        source: (item.source || "apple") as MusicSource,
      }));

      const spotifySongs = spotifyResponse.items.map((item) => ({
        ...item,
        source: (item.source || "apple") as MusicSource,
      }));

      const allSongs = [...appleMusicSongs, ...spotifySongs].sort((a, b) => {
        const timestampA = new Date(a.processedTimestamp).getTime();
        const timestampB = new Date(b.processedTimestamp).getTime();
        return timestampB - timestampA;
      });

      if (allSongs.length > 0) {
        setNowPlaying(allSongs[0]);
        setRecentlyPlayed(allSongs.slice(1));
        setGradientColors(getBrightPalette(allSongs[0]));
      } else {
        setNowPlaying(null);
        setRecentlyPlayed([]);
        setGradientColors(BRIGHT_PALETTES[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch music history");
      console.error("Error fetching music history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMusicHistory();

    const intervalId = window.setInterval(() => {
      void fetchMusicHistory();
    }, HISTORY_AUTO_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchMusicHistory]);

  const refreshMusicHistory = useCallback(async () => {
    await fetchMusicHistory();
  }, [fetchMusicHistory]);

  return useMemo(
    () => ({
      nowPlaying,
      recentlyPlayed,
      loading,
      error,
      gradientColors,
      refreshMusicHistory,
    }),
    [
      nowPlaying,
      recentlyPlayed,
      loading,
      error,
      gradientColors,
      refreshMusicHistory,
    ],
  );
};
