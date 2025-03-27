import React, { memo } from "react";
import styles from "../styles/SkeletonLoader.module.css";

/**
 * Skeleton loader component for the Recently Played List
 * Shows placeholder content while data is loading
 */
const SkeletonLoader: React.FC = () => {
  // Create an array of 4 placeholder items for each row
  const skeletonItems = Array(4).fill(null);

  return (
    <div className={styles.recentlyPlayedSkeletonContainer}>
      {/* Three rows of skeletons */}
      {[1, 2, 3].map((rowNum) => (
        <div
          key={`skeleton-row-${rowNum}`}
          className={styles.recentlyPlayedSkeletonRow}
        >
          {skeletonItems.map((_, index) => (
            <div
              key={`skeleton-${rowNum}-${index}`}
              className={styles.recentlyPlayedSkeletonTrack}
            >
              <div
                className={`${styles.recentlyPlayedSkeletonImg} ${styles.skeletonLoader}`}
              ></div>
              <div className={styles.recentlyPlayedSkeletonText}>
                <div
                  className={`${styles.recentlyPlayedSkeletonTitle} ${styles.skeletonLoader}`}
                ></div>
                <div
                  className={`${styles.recentlyPlayedSkeletonSubtitle} ${styles.skeletonLoader}`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Memoize the component as it has no props and will never need to re-render
export default memo(SkeletonLoader);
