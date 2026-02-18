import appleMusicLogo from "../../assets/apple-music.svg";
import spotifyLogo from "../../assets/spotify.svg";
import type { MusicSource } from "../../types/MusicSource";
import { getMusicSourceDisplayName } from "../../types/MusicSource";
import { openUrlInNewTab } from "../../utils/navigation";
import "./index.css";

type SourceIndicatorProps = {
  source?: MusicSource;
  size?: "small" | "large";
  url?: string;
};

const SourceIndicator = ({ source, size = "small", url }: SourceIndicatorProps) => {
  const actualSource: MusicSource = source && source !== "unknown" ? source : "apple";
  const displayName = getMusicSourceDisplayName(actualSource);
  const sizeClass =
    size === "large"
      ? "source-indicator-large"
      : "source-indicator-small";

  return (
    <div
      className={`source-indicator ${sizeClass}`}
      title={url ? `Click to open in ${displayName}` : displayName}
      aria-label={`Source: ${displayName}`}
      onClick={() => {
        openUrlInNewTab(url);
      }}
      style={{
        cursor: url ? "pointer" : "default",
        pointerEvents: url ? "auto" : "none",
      }}
    >
      <img
        src={actualSource === "apple" ? appleMusicLogo : spotifyLogo}
        alt={displayName}
      />
    </div>
  );
};

export default SourceIndicator;
