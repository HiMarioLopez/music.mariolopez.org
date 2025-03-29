import { createContext, useContext } from "react";
import { MusicItem } from "../models/MusicItem";

interface MusicContextType {
  nowPlaying: MusicItem | null;
  recentlyPlayed: MusicItem[];
  loading: boolean;
  error: string | null;
  refreshMusicHistory: () => Promise<void>;
}

export const MusicContext = createContext<MusicContextType | undefined>(
  undefined,
);

// Custom hook to use the music context
export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusicContext must be used within a MusicProvider");
  }
  return context;
};
