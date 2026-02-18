import { useMemo } from "preact/hooks";
import type { AppleMusicSong } from "../models/AppleMusicSong";

export interface SongDistribution {
  topRowSongs: AppleMusicSong[];
  middleRowSongs: AppleMusicSong[];
  bottomRowSongs: AppleMusicSong[];
}

export const useSongDistribution = (
  recentlyPlayed: AppleMusicSong[],
): SongDistribution => {
  return useMemo(() => {
    const seenIds = new Set<string>();
    const uniqueSongs = recentlyPlayed.filter((song) => {
      if (seenIds.has(song.id)) {
        return false;
      }
      seenIds.add(song.id);
      return true;
    });

    const processedSongs =
      uniqueSongs.length < 10
        ? [...uniqueSongs, ...uniqueSongs, ...uniqueSongs]
        : [...uniqueSongs];

    const songCount = processedSongs.length;
    const rowSize = Math.ceil(songCount / 3);

    const topRowSongs = processedSongs.slice(0, rowSize);
    const middleRowSongs = processedSongs.slice(rowSize, rowSize * 2);
    const bottomRowSongs = processedSongs.slice(rowSize * 2);

    const ensureSongsForRow = (rowSongs: AppleMusicSong[]): AppleMusicSong[] => {
      return rowSongs.length > 0 ? rowSongs : [...topRowSongs];
    };

    return {
      topRowSongs,
      middleRowSongs: ensureSongsForRow(middleRowSongs),
      bottomRowSongs: ensureSongsForRow(bottomRowSongs),
    };
  }, [recentlyPlayed]);
};
