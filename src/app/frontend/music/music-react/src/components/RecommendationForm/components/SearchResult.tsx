import React, { memo } from "react";
import { Result } from "../hooks/RecommendationForm.types";

type SearchResultProps = {
  result: Result;
  index: number;
  isActive: boolean;
  onSelect: (result: Result) => void;
};

const SearchResult: React.FC<SearchResultProps> = ({
  result,
  index,
  isActive,
  onSelect,
}) => (
  <li
    key={`${result.type}-${result.id}`}
    id={`result-${index}`}
    data-index={index}
    onClick={() => onSelect(result)}
    className={`${result.type}-result ${isActive ? "active" : ""}`}
    role="option"
    aria-selected={isActive}
    tabIndex={-1}
  >
    {result.artworkUrl && (
      <img
        src={result.artworkUrl}
        alt=""
        className="result-artwork"
        aria-hidden="true"
        loading="lazy"
      />
    )}
    <div className="result-info">
      <div className="result-info-text">
        <strong>{result.name}</strong>
        {result.type === "songs" && (
          <>
            {result.artist && <span> by {result.artist}</span>}
            {result.album && <span> • {result.album}</span>}
          </>
        )}
        {result.type === "albums" && (
          <>
            {result.artist && <span> by {result.artist}</span>}
            {result.trackCount && <span> • {result.trackCount} tracks</span>}
          </>
        )}
        {result.type === "artists" && result.genres && (
          <span>{result.genres[0]}</span>
        )}
      </div>
      <span className={`type-indicator ${result.type}`}>
        {result.type === "songs"
          ? "Song"
          : result.type === "albums"
            ? "Album"
            : "Artist"}
      </span>
    </div>
  </li>
);

export default memo(SearchResult);
