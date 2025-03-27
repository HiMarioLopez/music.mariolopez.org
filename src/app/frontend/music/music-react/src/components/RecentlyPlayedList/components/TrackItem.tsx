import React, { memo, useMemo, useState } from "react";
import albumPlaceholder from "../../../assets/album-placeholder.svg";
import { MusicItem } from "../../../context/MusicContext";
import { getProcessedArtworkUrl } from "../../../utils/imageProcessing";
import styles from "../styles/TrackItem.module.css";

interface TrackItemProps {
  track: MusicItem;
  index: number;
  rowName: string;
}

/**
 * Individual track item component used in carousels
 */
const TrackItem: React.FC<TrackItemProps> = ({ track, index, rowName }) => {
  // State to track if image loading has failed
  const [imageError, setImageError] = useState(false);

  // Memoize the processed artwork URL to avoid recalculating on every render
  const artworkUrl = useMemo(
    () => getProcessedArtworkUrl(track.artworkUrl),
    [track.artworkUrl],
  );

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div key={`${rowName}-${track.id}-${index}`}>
      <div className={styles.track}>
        <img
          src={imageError ? albumPlaceholder : artworkUrl}
          alt={`${track.name} Album Cover`}
          title={`${track.name} by ${track.artistName}`}
          onError={handleImageError}
        />
        <div className={styles.trackTextContainer}>
          <h3 title={track.name}>{track.name}</h3>
          <p title={`${track.artistName} - ${track.albumName}`}>
            {track.artistName} - {track.albumName}
          </p>
        </div>
      </div>
    </div>
  );
};

// Custom comparison function for memo
// Only re-render if track ID changes or index changes
const arePropsEqual = (
  prevProps: TrackItemProps,
  nextProps: TrackItemProps,
) => {
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.index === nextProps.index &&
    prevProps.rowName === nextProps.rowName
  );
};

export default memo(TrackItem, arePropsEqual);
