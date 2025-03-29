import React from "react";
import {
  RecommendedSong,
  RecommendedAlbum,
  RecommendedArtist,
} from "../../../types/Recommendations";
import styles from "../styles/recommendationItem.module.css";
import { Note } from "../types/CombinedRecommendationList.types";

type RecommendationItemProps = {
  item: RecommendedSong | RecommendedAlbum | RecommendedArtist;
  type: "song" | "album" | "artist";
  notes?: Note[];
  onNoteClick?: () => void;
};

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  item,
  type,
  notes,
  onNoteClick,
}) => {
  let title = "";
  let subtitle = "";

  if (type === "song") {
    const songItem = item as RecommendedSong;
    title = songItem.songTitle;
    subtitle = `${songItem.artistName} - ${songItem.albumName}`;
  } else if (type === "album") {
    const albumItem = item as RecommendedAlbum;
    title = albumItem.albumTitle;
    subtitle = `${albumItem.artistName}${albumItem.trackCount ? ` • ${albumItem.trackCount} tracks` : ""}`;
  } else if (type === "artist") {
    const artistItem = item as RecommendedArtist;
    title = artistItem.artistName;
    subtitle =
      artistItem.genres && artistItem.genres.length > 0
        ? artistItem.genres.join(", ")
        : "";
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>
        {subtitle && (
          <p className={styles.subtitle} title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      <button
        className={styles.noteButton}
        onClick={onNoteClick}
        title="Add note"
        data-testid="note-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
    </div>
  );
};

export default RecommendationItem;
