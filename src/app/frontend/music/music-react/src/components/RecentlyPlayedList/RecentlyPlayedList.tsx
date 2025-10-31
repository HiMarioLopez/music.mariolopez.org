import React from "react";
import { useMusicContext } from "../../context/MusicContext";
import CarouselRow from "./components/CarouselRow";
import SkeletonLoader from "./components/SkeletonLoader";
import { useCarouselSettings } from "./hooks/useCarouselSettings";
import { useSongDistribution } from "./hooks/useSongDistribution";
import styles from "./styles/RecentlyPlayedList.module.css";

/**
 * RecentlyPlayedList component displays three horizontal carousels
 * of the user's recently played songs
 */
const RecentlyPlayedList: React.FC = () => {
  const { recentlyPlayed, loading, error } = useMusicContext();
  const { topSliderSettings, middleSliderSettings, bottomSliderSettings } =
    useCarouselSettings();
  const { topRowSongs, middleRowSongs, bottomRowSongs } =
    useSongDistribution(recentlyPlayed);

  // Show skeleton loader during loading
  if (loading && recentlyPlayed.length === 0) {
    return (
      <div className={styles.recentlyPlayedListComponent}>
        <h1>Recently Played</h1>
        <SkeletonLoader />
      </div>
    );
  }

  // Show error state
  if (error && recentlyPlayed.length === 0) {
    return (
      <div className={styles.recentlyPlayedListComponent}>
        <h1>Recently Played</h1>
        <p>Error loading songs: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.recentlyPlayedListComponent}>
      <h1>Recently Played</h1>
      {recentlyPlayed.length > 0 ? (
        <>
          {/* Top row slider - moves left to right */}
          <CarouselRow
            songs={topRowSongs}
            settings={topSliderSettings}
            rowName="top"
          />
          {/* Middle row slider - moves right to left */}
          <CarouselRow
            songs={middleRowSongs}
            settings={middleSliderSettings}
            rowName="middle"
          />
          {/* Bottom row slider - moves left to right slower */}
          <CarouselRow
            songs={bottomRowSongs}
            settings={bottomSliderSettings}
            rowName="bottom"
          />
        </>
      ) : (
        <p>No recently played songs available</p>
      )}
    </div>
  );
};

export default RecentlyPlayedList;
