import { ReactNode, useEffect, useState } from "react";
import { MusicContext } from "../context/MusicContext";
import { apiService } from "../services/apiService";
import { AppleMusicSong } from "../models/AppleMusicSong";
import { MusicSource } from "../types/MusicSource";

interface MusicProviderProps {
  children: ReactNode;
}

const HISTORY_AUTO_REFRESH_INTERVAL = 60000; // Refresh every minute
const HISTORY_TRACK_LIMIT = 16; // (5 x 3) carousels + 1 for now playing

// TEMPORARY: Enable mock source data for testing indicators
// Set to false once backend provides real source data
const ENABLE_MOCK_SOURCE_DATA = false;

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [nowPlaying, setNowPlaying] = useState<AppleMusicSong | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<AppleMusicSong[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMusicHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getMusicHistory(HISTORY_TRACK_LIMIT);

      if (response.items.length > 0) {
        // TEMPORARY: Add mock source data for testing
        let processedItems = response.items;
        if (ENABLE_MOCK_SOURCE_DATA) {
          processedItems = response.items.map((item, index) => {
            // Alternate between apple, spotify, and no source for testing
            const sources: (MusicSource | undefined)[] = ['apple', 'spotify', undefined];
            return {
              ...item,
              source: sources[index % 3],
            };
          });
        }

        // Set the first item as now playing
        setNowPlaying(processedItems[0]);

        // Set the rest as recently played
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

  const refreshMusicHistory = async () => {
    await fetchMusicHistory();
  };

  const value = {
    nowPlaying,
    recentlyPlayed,
    loading,
    error,
    refreshMusicHistory,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};
