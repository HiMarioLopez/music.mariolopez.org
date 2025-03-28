import React from "react";
import { useMusicContext } from "../../context/MusicContext";
import CarouselRow from "./components/CarouselRow";
import SkeletonLoader from "./components/SkeletonLoader";
import { useCarouselSettings } from "./hooks/useCarouselSettings";
import { useTrackDistribution } from "./hooks/useTrackDistribution";
import styles from "./styles/RecentlyPlayedList.module.css";

// Import React Slick CSS
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";

/**
 * RecentlyPlayedList component displays three horizontal carousels
 * of the user's recently played tracks
 */
const RecentlyPlayedList: React.FC = () => {
  const { recentlyPlayed, loading, error } = useMusicContext();
  const { topSliderSettings, middleSliderSettings, bottomSliderSettings } =
    useCarouselSettings();
  const { topRowTracks, middleRowTracks, bottomRowTracks } =
    useTrackDistribution(recentlyPlayed);

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
        <p>Error loading tracks: {error}</p>
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
            tracks={topRowTracks}
            settings={topSliderSettings}
            rowName="top"
          />
          {/* Middle row slider - moves right to left */}
          <CarouselRow
            tracks={middleRowTracks}
            settings={middleSliderSettings}
            rowName="middle"
          />
          {/* Bottom row slider - moves left to right slower */}
          <CarouselRow
            tracks={bottomRowTracks}
            settings={bottomSliderSettings}
            rowName="bottom"
          />
        </>
      ) : (
        <p>No recently played tracks available</p>
      )}
    </div>
  );
};

export default RecentlyPlayedList;
