import React, { memo, useMemo, useState } from "react";
import albumPlaceholder from "../../../assets/album-placeholder.svg";
import { MusicItem } from "../../../context/MusicContext";
import { getProcessedArtworkUrl } from "../../../utils/imageProcessing";
import styles from "../styles/SongItem.module.css";

interface SongItemProps {
  song: MusicItem;
  index: number;
  rowName: string;
}

/**
 * Individual song item component used in carousels
 */
const SongItem: React.FC<SongItemProps> = ({ song, index, rowName }) => {
  // State to song if image loading has failed
  const [imageError, setImageError] = useState(false);

  // Memoize the processed artwork URL to avoid recalculating on every render
  const artworkUrl = useMemo(
    () => getProcessedArtworkUrl(song.artworkUrl),
    [song.artworkUrl],
  );

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div key={`${rowName}-${song.id}-${index}`}>
      <div className={styles.song}>
        <img
          src={imageError ? albumPlaceholder : artworkUrl}
          alt={`${song.name} Album Cover`}
          title={`${song.name} by ${song.artistName}`}
          onError={handleImageError}
        />
        <div className={styles.songTextContainer}>
          <h3 title={song.name}>{song.name}</h3>
          <p title={`${song.artistName} - ${song.albumName}`}>
            {song.artistName} - {song.albumName}
          </p>
        </div>
      </div>
    </div>
  );
};

// Custom comparison function for memo
// Only re-render if song ID changes or index changes
const arePropsEqual = (prevProps: SongItemProps, nextProps: SongItemProps) => {
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.index === nextProps.index &&
    prevProps.rowName === nextProps.rowName
  );
};

export default memo(SongItem, arePropsEqual);
