import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '../services/apiService';

// Define types for our music data based on the API response
export interface MusicItem {
  processedTimestamp: string;
  isrc: string;
  durationInMillis: number;
  composerName: string;
  trackId: string;
  url: string;
  genreNames: string[];
  name: string;
  hasLyrics: boolean;
  trackNumber: number;
  releaseDate: string;
  artworkColors: {
    textColor1: string;
    backgroundColor: string;
    textColor4: string;
    textColor2: string;
    textColor3: string;
  };
  albumName: string;
  isAppleDigitalMaster: boolean;
  id: string;
  artworkUrl: string;
  artistName: string;
}

export interface Pagination {
  count: number;
  hasMore: boolean;
  nextToken?: string;
}

export interface MusicHistoryResponse {
  items: MusicItem[];
  pagination: Pagination;
}

interface MusicContextType {
  nowPlaying: MusicItem | null;
  recentlyPlayed: MusicItem[];
  loading: boolean;
  error: string | null;
  refreshMusicHistory: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [nowPlaying, setNowPlaying] = useState<MusicItem | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMusicHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.music.getMusicHistory(20);
      
      if (response.items.length > 0) {
        // Set the first item as now playing
        setNowPlaying(response.items[0]);
        
        // Set the rest as recently played
        setRecentlyPlayed(response.items.slice(1));
      } else {
        setNowPlaying(null);
        setRecentlyPlayed([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch music history');
      console.error('Error fetching music history:', err);
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
    }, 60000); // Refresh every minute
    
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
    refreshMusicHistory
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

// Custom hook to use the music context
export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
};
