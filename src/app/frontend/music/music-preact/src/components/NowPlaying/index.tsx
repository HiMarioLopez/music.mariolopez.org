import type { AppleMusicSong } from "../../models/AppleMusicSong";
import { formatRelativeTime } from "../../utils/formatters";
import { getProcessedArtworkUrl } from "../../utils/imageProcessing";
import { openUrlInNewTab } from "../../utils/navigation";
import SourceIndicator from "../SourceIndicator";
import "./index.css";

type NowPlayingProps = {
  nowPlaying: AppleMusicSong | null;
  loading: boolean;
  error: string | null;
};

const NowPlaying = ({ nowPlaying, loading, error }: NowPlayingProps) => {
  const relativeTime = nowPlaying?.processedTimestamp
    ? formatRelativeTime(nowPlaying.processedTimestamp)
    : "";

  if (loading && !nowPlaying) {
    return (
      <div className="now-playing-component">
        <div className="album-art-container">
          <div className="now-playing-skeleton-img skeleton-loader"></div>
        </div>
        <div className="now-playing-component-text-container">
          <h1>Mario&apos;s Now Playing</h1>
          <div className="now-playing-component-text">
            <div className="song-title-container">
              <div
                className="skeleton-loader"
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              ></div>
              <div className="now-playing-skeleton-title skeleton-loader"></div>
            </div>
            <div className="now-playing-skeleton-artist skeleton-loader"></div>
            <div className="now-playing-skeleton-album skeleton-loader"></div>
            <div className="now-playing-skeleton-timestamp skeleton-loader"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !nowPlaying) {
    return (
      <div className="now-playing-component">
        <img src={getProcessedArtworkUrl(undefined)} alt="Error Album Art" />
        <div className="now-playing-component-text-container">
          <h1>Mario&apos;s Now Playing</h1>
          <div className="now-playing-component-text">
            <h2>Unable to load music data</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="now-playing-component">
      <div className="album-art-container">
        <img
          src={getProcessedArtworkUrl(nowPlaying?.artworkUrl, "300x300")}
          alt={`${nowPlaying?.albumName || "Album"} Art`}
          style={{ cursor: nowPlaying?.url ? "pointer" : "default" }}
          title={
            nowPlaying?.url ? `Click to open ${nowPlaying.name} in Apple Music` : ""
          }
          onClick={() => {
            openUrlInNewTab(nowPlaying?.url);
          }}
        />
      </div>
      <div className="now-playing-component-text-container">
        <div className="now-playing-header">
          <h1>Mario&apos;s Now Playing</h1>
        </div>
        <div className="now-playing-component-text">
          <div className="song-title-container">
            <SourceIndicator source={nowPlaying?.source} size="small" url={nowPlaying?.url} />
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
              className="now-playing-timestamp"
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
