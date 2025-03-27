import { useMemo } from "react";
import { MusicItem } from "../../../context/MusicContext";

/**
 * Hook to distribute tracks across three carousels
 */
export const useTrackDistribution = (recentlyPlayed: MusicItem[]) => {
  return useMemo(() => {
    // Prepare track data - if we have fewer than desired tracks, duplicate them
    const processedTracks =
      recentlyPlayed.length < 10
        ? [...recentlyPlayed, ...recentlyPlayed, ...recentlyPlayed]
        : [...recentlyPlayed];

    // Split tracks into three arrays for top, middle, and bottom sliders
    const trackCount = processedTracks.length;
    const rowSize = Math.ceil(trackCount / 3);

    const topRowTracks = processedTracks.slice(0, rowSize);
    const middleRowTracks = processedTracks.slice(rowSize, rowSize * 2);
    const bottomRowTracks = processedTracks.slice(rowSize * 2);

    // Fallback if not enough tracks for any row
    const ensureTracksForRow = (rowTracks: MusicItem[]) => {
      return rowTracks.length > 0 ? rowTracks : [...topRowTracks];
    };

    const finalMiddleRowTracks = ensureTracksForRow(middleRowTracks);
    const finalBottomRowTracks = ensureTracksForRow(bottomRowTracks);

    return {
      topRowTracks,
      middleRowTracks: finalMiddleRowTracks,
      bottomRowTracks: finalBottomRowTracks,
    };
  }, [recentlyPlayed]);
};
