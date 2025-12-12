import cx from "classix";
import React, { useCallback } from "react";
import { useMusicContext } from "../../context/MusicContext";
import { formatRelativeTime } from "../../utils/formatters";
import { getProcessedArtworkUrl } from "../../utils/imageProcessing";
import { openUrlInNewTab } from "../../utils/navigation";
import { SourceIndicator } from "../SourceIndicator/SourceIndicator";
import styles from "./NowPlaying.module.css";

const NowPlaying: React.FC = () => {
  const { nowPlaying, loading, error } = useMusicContext();

  // Format the timestamp if available
  const relativeTime = nowPlaying?.processedTimestamp
    ? formatRelativeTime(nowPlaying.processedTimestamp)
    : "";

  // Memoize callback before any early returns (React hooks rule)
  const handleAlbumArtClick = useCallback(() => {
    openUrlInNewTab(nowPlaying?.url);
  }, [nowPlaying?.url]);

  // Show skeleton loader during loading
  if (loading && !nowPlaying) {
    return (
      <div className={styles.nowPlayingComponent}>
        <div className={styles.albumArtContainer}>
          <div
            className={cx(styles.nowPlayingSkeletonImg, styles.skeletonLoader)}
          ></div>
        </div>
        <div className={styles.nowPlayingComponentTextContainer}>
          <h1>Mario&apos;s Now Playing</h1>
          <div className={styles.nowPlayingComponentText}>
            <div className={styles.songTitleContainer}>
              <div
                className={cx(styles.skeletonLoader)}
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              ></div>
              <div
                className={cx(
                  styles.nowPlayingSkeletonTitle,
                  styles.skeletonLoader,
                )}
              ></div>
            </div>
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
            <div
              className={cx(
                styles.nowPlayingSkeletonTimestamp,
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
        <img src={getProcessedArtworkUrl(undefined)} alt="Error Album Art" />
        <div className={styles.nowPlayingComponentTextContainer}>
          <h1>Mario&apos;s Now Playing</h1>
          <div className={styles.nowPlayingComponentText}>
            <h2>Unable to load music data</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.nowPlayingComponent}>
      <div className={styles.albumArtContainer}>
        <img
          src={getProcessedArtworkUrl(nowPlaying?.artworkUrl, "300x300")}
          alt={`${nowPlaying?.albumName || "Album"} Art`}
          onClick={handleAlbumArtClick}
          style={{ cursor: nowPlaying?.url ? "pointer" : "default" }}
          title={
            nowPlaying?.url
              ? `Click to open ${nowPlaying.name} in Apple Music`
              : ""
          }
        />
      </div>
      <div className={styles.nowPlayingComponentTextContainer}>
        <div className={styles.nowPlayingHeader}>
          <h1>Mario&apos;s Now Playing</h1>
        </div>
        <div className={styles.nowPlayingComponentText}>
          <div className={styles.songTitleContainer}>
            <SourceIndicator
              source={nowPlaying?.source}
              size="small"
              url={nowPlaying?.url}
            />
            <h2 title={nowPlaying?.name || "No song playing"}>
              {nowPlaying?.name || "No song playing"}
            </h2>
          </div>
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
