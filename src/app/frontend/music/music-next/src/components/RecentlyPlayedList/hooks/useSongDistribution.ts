import { useMemo } from "react";
import { AppleMusicSong } from "../../../models/AppleMusicSong";

/**
 * Hook to distribute songs across three carousels
 */
export const useSongDistribution = (recentlyPlayed: AppleMusicSong[]) => {
  return useMemo(() => {
    // Remove duplicate songs based on song ID, keeping first occurrence
    const seenIds = new Set<string>();
    const uniqueSongs = recentlyPlayed.filter((song) => {
      if (seenIds.has(song.id)) {
        return false;
      }
      seenIds.add(song.id);
      return true;
    });

    // Prepare song data - if we have fewer than desired songs, duplicate them
    const processedSongs =
      uniqueSongs.length < 10
        ? [...uniqueSongs, ...uniqueSongs, ...uniqueSongs]
        : [...uniqueSongs];

    // Split songs into three arrays for top, middle, and bottom sliders
    const songCount = processedSongs.length;
    const rowSize = Math.ceil(songCount / 3);

    const topRowSongs = processedSongs.slice(0, rowSize);
    const middleRowSongs = processedSongs.slice(rowSize, rowSize * 2);
    const bottomRowSongs = processedSongs.slice(rowSize * 2);

    // Fallback if not enough songs for any row
    const ensureSongsForRow = (rowSongs: AppleMusicSong[]) => {
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
