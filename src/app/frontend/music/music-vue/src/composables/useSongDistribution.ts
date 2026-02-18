import { computed, unref, type Ref } from "vue";
import type { AppleMusicSong } from "../models/AppleMusicSong";

type MaybeRefSongs = Readonly<Ref<AppleMusicSong[]>> | AppleMusicSong[];

export const useSongDistribution = (recentlyPlayed: MaybeRefSongs) => {
  return computed(() => {
    const songs = unref(recentlyPlayed);
    const seenIds = new Set<string>();
    const uniqueSongs = songs.filter((song) => {
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

    const ensureSongsForRow = (rowSongs: AppleMusicSong[]) => {
      return rowSongs.length > 0 ? rowSongs : [...topRowSongs];
    };

    return {
      topRowSongs,
      middleRowSongs: ensureSongsForRow(middleRowSongs),
      bottomRowSongs: ensureSongsForRow(bottomRowSongs),
    };
  });
};
