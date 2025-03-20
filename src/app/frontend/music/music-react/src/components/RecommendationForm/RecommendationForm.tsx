import React, { KeyboardEvent, memo, useEffect, useMemo, useRef } from 'react';
import { ClearIcon, LoadingIcon, SearchIcon } from '../Icons';
import './RecommendationForm.styles.css';
import { SearchResult } from './RecommendationForm.types';
import { useRecommendationSearch } from './useRecommendationSearch';

export type RecommendationFormProps = {
  onRecommend: (songTitle: string) => void;
};

// Memoized sub-components for better performance
const ResultSectionHeader = memo(({ title }: { title: string }) => (
  <div className="result-section-header" role="presentation">
    {title}
  </div>
));

const HintResult = memo(({
  hint,
  index,
  isActive,
  onSelect
}: {
  hint: SearchResult;
  index: number;
  isActive: boolean;
  onSelect: (name: string) => void;
}) => (
  <li
    key={`hint-${hint.id}`}
    id={`result-${index}`}
    data-index={index}
    onClick={() => onSelect(hint.name)}
    className={`hint-result ${isActive ? 'active' : ''}`}
    role="option"
    aria-selected={isActive}
    tabIndex={-1}
  >
    <div className="result-info">
      <strong>{hint.name}</strong>
    </div>
  </li>
));

const ShowMoreButton = memo(({
  index,
  isActive,
  onClick,
  text,
  isLoading
}: {
  index: number;
  isActive: boolean;
  onClick: () => void;
  text: string;
  isLoading?: boolean;
}) => (
  <li
    id={`result-${index}`}
    data-index={index}
    className={`hint-result show-more ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
    onClick={onClick}
    role="option"
    aria-selected={isActive}
    tabIndex={-1}
  >
    <div className="result-info">
      {isLoading ? (
        <div className="inline-loader">
          <LoadingIcon />
          <span>Loading more results...</span>
        </div>
      ) : (
        <span className="show-more-text">{text}</span>
      )}
    </div>
  </li>
));

const SongResult = memo(({
  result,
  index,
  isActive,
  onSelect
}: {
  result: SearchResult;
  index: number;
  isActive: boolean;
  onSelect: (result: SearchResult) => void;
}) => (
  <li
    key={`${result.type}-${result.id}`}
    id={`result-${index}`}
    data-index={index}
    onClick={() => onSelect(result)}
    className={`${result.type}-result ${isActive ? 'active' : ''}`}
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
        {result.type === 'songs' && (
          <>
            {result.artist && <span> by {result.artist}</span>}
            {result.album && <span> • {result.album}</span>}
          </>
        )}
        {result.type === 'albums' && (
          <>
            {result.artist && <span> by {result.artist}</span>}
            {result.trackCount && <span> • {result.trackCount} tracks</span>}
          </>
        )}
        {result.type === 'artists' && (
          result.genres && <span>{result.genres[0]}</span>
        )}
      </div>
      <span className={`type-indicator ${result.type}`}>
        {result.type === 'songs' ? 'Song' :
          result.type === 'albums' ? 'Album' : 'Artist'}
      </span>
    </div>
  </li>
));

const SearchButton = memo(({
  isLoading,
  isAuthenticating,
  searchTerm,
  onClear,
  disabled
}: {
  isLoading: boolean;
  isAuthenticating: boolean;
  searchTerm: string;
  onClear: () => void;
  disabled: boolean;
}) => (
  <button
    className={`search-button ${(isLoading || isAuthenticating) ? 'spinning' : ''}`}
    disabled={disabled}
    onClick={() => {
      if (searchTerm && !isLoading && !isAuthenticating) {
        onClear();
      }
    }}
    type="button"
    title={isLoading ? "Searching..." :
      searchTerm ? "Clear search" : "Search"}
    aria-label={isLoading ? "Searching..." :
      searchTerm ? "Clear search" : "Search"}
  >
    {(isLoading || isAuthenticating) ? <LoadingIcon /> :
      searchTerm ? <ClearIcon /> : <SearchIcon />}
  </button>
));

// Create a stable ID to reduce unnecessary re-renders
// See: https://stackoverflow.com/a/49688084
const SEARCH_INPUT_ID = "song-search-input";
const RESULTS_LIST_ID = "search-results-list";

const RecommendationForm: React.FC<RecommendationFormProps> = ({ onRecommend }) => {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const [activeResultIndex, setActiveResultIndex] = React.useState<number>(-1);

  const {
    searchTerm,
    hintResults,
    songResults,
    isLoading,
    isAuthenticating,
    isLoadingMore,
    tokenError,
    hasResults,
    isResultsVisible,
    showAllResults,
    inputRef,
    handleHintSelect,
    handleSongSelect,
    handleLoadMore,
    handleClearSearch,
    handleResultsVisibility,
    setShowAllResults,
    setSearchTerm,
  } = useRecommendationSearch({ onRecommend });

  // Combined results for keyboard navigation
  const allVisibleResults = useMemo(() => {
    const visibleHints = showAllResults ? hintResults : hintResults.slice(0, 3);
    const visibleSongs = showAllResults ? songResults : songResults.slice(0, 3);
    const results = [...visibleHints, ...visibleSongs];

    // Add the "Show more" options if applicable
    if (!showAllResults) {
      if (hintResults.length > 3) results.push({ id: 'show-more-hints', name: 'Show more suggestions...', type: 'hint' });
      if (songResults.length === 3) results.push({ id: 'show-more-songs', name: 'Show more results...', type: 'hint' });
    }

    return results;
  }, [hintResults, songResults, showAllResults]);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.target as Node)
    ) {
      handleResultsVisibility(false);
      setActiveResultIndex(-1);
    }
  };

  // Add event listener for clicks outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isResultsVisible || !hasResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveResultIndex(prevIndex =>
          prevIndex < allVisibleResults.length - 1 ? prevIndex + 1 : 0 // Cycle to top when at bottom
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveResultIndex(prevIndex =>
          prevIndex > 0 ? prevIndex - 1 : allVisibleResults.length - 1 // Cycle to bottom when at top
        );
        break;
      case 'Home':
        e.preventDefault();
        setActiveResultIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveResultIndex(allVisibleResults.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeResultIndex >= 0 && activeResultIndex < allVisibleResults.length) {
          const selected = allVisibleResults[activeResultIndex];

          // Reset active index first for all actions
          setActiveResultIndex(-1);

          if (selected.id === 'show-more-hints') {
            setShowAllResults(true);
          } else if (selected.id === 'show-more-songs') {
            handleLoadMore();
          } else if (selected.type === 'hint') {
            handleHintSelect(selected.name);
          } else {
            handleSongSelect(selected);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleResultsVisibility(false);
        setActiveResultIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeResultIndex >= 0 && resultsRef.current) {
      const activeItem = resultsRef.current.querySelector(`li[data-index="${activeResultIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeResultIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveResultIndex(-1);
  }, [searchTerm]);

  // Memo the clear handler to prevent rerenders
  const handleInputClear = React.useCallback(() => {
    handleClearSearch();
    inputRef.current?.focus();
  }, [handleClearSearch]);

  // If we're still fetching the token or there's an error
  if (tokenError) {
    return (
      <div className="recommendation-form-component styled-container">
        <h1>Make a Recommendation</h1>
        <div className="auth-error" role="alert">
          <p>{tokenError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Memoize rendering the hint results
  const renderHints = useMemo(() => {
    if (!hintResults.length) return null;

    return (
      <>
        <ResultSectionHeader title="Suggested Searches" />
        {(showAllResults ? hintResults : hintResults.slice(0, 3)).map((hint, index) => (
          <HintResult
            key={hint.id}
            hint={hint}
            index={index}
            isActive={index === activeResultIndex}
            onSelect={handleHintSelect}
          />
        ))}
        {!showAllResults && hintResults.length > 3 && (
          <ShowMoreButton
            index={hintResults.slice(0, 3).length}
            isActive={hintResults.slice(0, 3).length === activeResultIndex}
            onClick={() => setShowAllResults(true)}
            text="Show more suggestions..."
          />
        )}
      </>
    );
  }, [hintResults, showAllResults, activeResultIndex, handleHintSelect]);

  // Memoize rendering the song results
  const renderSongs = useMemo(() => {
    if (!songResults.length) return null;

    const hintsCount = hintResults.length;
    const showMoreHints = !showAllResults && hintsCount > 3;

    return (
      <>
        <ResultSectionHeader title="Search Results" />
        {(showAllResults ? songResults : songResults.slice(0, 3)).map((result, index) => {
          const resultIndex = hintsCount + (showAllResults ? 0 : (showMoreHints ? 1 : 0)) + index;
          return (
            <SongResult
              key={result.id}
              result={result}
              index={resultIndex}
              isActive={resultIndex === activeResultIndex}
              onSelect={handleSongSelect}
            />
          );
        })}
        {!showAllResults && songResults.length === 3 && (
          <ShowMoreButton
            index={hintsCount + (showMoreHints ? 1 : 0) + 3}
            isActive={hintsCount + (showMoreHints ? 1 : 0) + 3 === activeResultIndex}
            onClick={handleLoadMore}
            text="Show more results..."
            isLoading={isLoadingMore}
          />
        )}
      </>
    );
  }, [songResults, hintResults, showAllResults, activeResultIndex, handleSongSelect, handleLoadMore, isLoadingMore]);

  return (
    <div className="recommendation-form-component styled-container" key="rec-form-container">
      <h1 id="form-title">Make a Recommendation</h1>
      <div className="search-container" ref={searchContainerRef} key="search-container">
        <div className="input-wrapper" key="input-wrapper">
          <label htmlFor={SEARCH_INPUT_ID} className="visually-hidden">
            Search for a song
          </label>
          <input
            ref={inputRef}
            id={SEARCH_INPUT_ID}
            key={SEARCH_INPUT_ID}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a song..."
            required
            disabled={isAuthenticating}
            onFocus={() => hasResults && handleResultsVisibility(true)}
            aria-describedby={hasResults && isResultsVisible ? RESULTS_LIST_ID : undefined}
            aria-expanded={hasResults && isResultsVisible}
            aria-autocomplete="list"
            aria-controls={hasResults ? RESULTS_LIST_ID : undefined}
            aria-activedescendant={activeResultIndex >= 0 ? `result-${activeResultIndex}` : undefined}
            aria-busy={isLoading || isAuthenticating}
            autoComplete="off"
          />
          <SearchButton
            isLoading={isLoading}
            isAuthenticating={isAuthenticating}
            searchTerm={searchTerm}
            onClear={handleInputClear}
            disabled={isAuthenticating}
          />
        </div>

        {hasResults && isResultsVisible && (
          <ul
            ref={resultsRef}
            id={RESULTS_LIST_ID}
            key={RESULTS_LIST_ID}
            className="search-results"
            role="listbox"
            aria-labelledby="form-title"
          >
            {renderHints}
            {renderSongs}
          </ul>
        )}
      </div>
    </div>
  );
};

// Memoize the entire component for performance
export default memo(RecommendationForm);
