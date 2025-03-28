import { useMemo } from "react";
import { MusicItem } from "../../../context/MusicContext";

/**
 * Hook to distribute songs across three carousels
 */
export const useSongDistribution = (recentlyPlayed: MusicItem[]) => {
  return useMemo(() => {
    // Prepare song data - if we have fewer than desired songs, duplicate them
    const processedSongs =
      recentlyPlayed.length < 10
        ? [...recentlyPlayed, ...recentlyPlayed, ...recentlyPlayed]
        : [...recentlyPlayed];

    // Split songs into three arrays for top, middle, and bottom sliders
    const songCount = processedSongs.length;
    const rowSize = Math.ceil(songCount / 3);

    const topRowSongs = processedSongs.slice(0, rowSize);
    const middleRowSongs = processedSongs.slice(rowSize, rowSize * 2);
    const bottomRowSongs = processedSongs.slice(rowSize * 2);

    // Fallback if not enough songs for any row
    const ensureSongsForRow = (rowSongs: MusicItem[]) => {
      return rowSongs.length > 0 ? rowSongs : [...topRowSongs];
    };

    const finalMiddleRowSongs = ensureSongsForRow(middleRowSongs);
    const finalBottomRowSongs = ensureSongsForRow(bottomRowSongs);

    return {
      topRowSongs,
      middleRowSongs: finalMiddleRowSongs,
      bottomRowSongs: finalBottomRowSongs,
    };
  }, [recentlyPlayed]);
};
