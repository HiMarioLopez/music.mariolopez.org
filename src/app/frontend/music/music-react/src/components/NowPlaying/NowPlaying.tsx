import cx from "classix";
import React from "react";
import placeholderAlbumArt from "../../assets/300.png";
import { useMusicContext } from "../../context/MusicContext";
import { formatRelativeTime } from "../../utils/formatters";
import styles from "./NowPlaying.module.css";

const NowPlaying: React.FC = () => {
  const { nowPlaying, loading, error } = useMusicContext();

  // Replace {w}x{h} in the artworkUrl with actual dimensions
  const getProcessedArtworkUrl = (url: string | undefined) => {
    if (!url) return placeholderAlbumArt;
    return url.replace("{w}x{h}", "300x300");
  };

  // Show skeleton loader during loading
  if (loading && !nowPlaying) {
    return (
      <div className={styles.nowPlayingComponent}>
        <div
          className={cx(styles.nowPlayingSkeletonImg, styles.skeletonLoader)}
        ></div>
        <div className={styles.nowPlayingComponentTextContainer}>
          <h1>Mario's Now Playing</h1>
          <div className={styles.nowPlayingComponentText}>
            <div
              className={cx(
                styles.nowPlayingSkeletonTitle,
                styles.skeletonLoader,
              )}
            ></div>
            <div
              className={cx(
                styles.nowPlayingSkeletonArtist,
                styles.skeletonLoader,
              )}
            ></div>
            <div
              className={cx(
                styles.nowPlayingSkeletonAlbum,
                styles.skeletonLoader,
              )}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !nowPlaying) {
    return (
      <div className={styles.nowPlayingComponent}>
        <img src={placeholderAlbumArt} alt="Error Album Art" />
        <div className={styles.nowPlayingComponentTextContainer}>
          <h1>Mario's Now Playing</h1>
          <div className={styles.nowPlayingComponentText}>
            <h2>Unable to load music data</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Format the timestamp if available
  const relativeTime = nowPlaying?.processedTimestamp
    ? formatRelativeTime(nowPlaying.processedTimestamp)
    : "";

  return (
    <div className={styles.nowPlayingComponent}>
      <img
        src={getProcessedArtworkUrl(nowPlaying?.artworkUrl)}
        alt={`${nowPlaying?.albumName || "Album"} Art`}
      />
      <div className={styles.nowPlayingComponentTextContainer}>
        <div className={styles.nowPlayingHeader}>
          <h1>Mario's Now Playing</h1>
        </div>
        <div className={styles.nowPlayingComponentText}>
          <h2 title={nowPlaying?.name || "No song playing"}>
            {nowPlaying?.name || "No song playing"}
          </h2>
          <p title={nowPlaying?.artistName || "Unknown Artist"}>
            {nowPlaying?.artistName || "Unknown Artist"}
          </p>
          <p title={nowPlaying?.albumName || "Unknown Album"}>
            {nowPlaying?.albumName || "Unknown Album"}
          </p>
          {relativeTime && (
            <span
              className={styles.nowPlayingTimestamp}
              title={`Played: ${new Date(nowPlaying?.processedTimestamp || "").toLocaleString()}`}
            >
              {relativeTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
