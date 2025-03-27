import React from "react";
import { Result } from "../types/RecommendationForm.types";
import "../styles/SelectedItemDisplay.styles.css";

interface SelectedItemDisplayProps {
  selectedItem: Result;
}

const SelectedItemDisplay: React.FC<SelectedItemDisplayProps> = ({
  selectedItem,
}) => {
  if (!selectedItem) return null;

  return (
    <div className="selected-item">
      {selectedItem.artworkUrl && (
        <img src={selectedItem.artworkUrl} alt="" aria-hidden="true" />
      )}
      <div className="result-info">
        <div className="result-info-text">
          <strong>{selectedItem.name}</strong>
          {selectedItem.type === "songs" && (
            <>
              {selectedItem.artist && <span> by {selectedItem.artist}</span>}
              {selectedItem.album && <span> • {selectedItem.album}</span>}
            </>
          )}
          {selectedItem.type === "albums" && (
            <>
              {selectedItem.artist && <span> by {selectedItem.artist}</span>}
              {selectedItem.trackCount && (
                <span> • {selectedItem.trackCount} tracks</span>
              )}
            </>
          )}
          {selectedItem.type === "artists" && selectedItem.genres && (
            <span>{selectedItem.genres[0]}</span>
          )}
        </div>
        <span className={`type-indicator ${selectedItem.type}`}>
          {selectedItem.type === "songs"
            ? "Song"
            : selectedItem.type === "albums"
              ? "Album"
              : "Artist"}
        </span>
      </div>
    </div>
  );
};

export default React.memo(SelectedItemDisplay);
