import React, { KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import placeholderAlbumArt from '../../assets/50.png';
import { RecommendedAlbum, RecommendedArtist, RecommendedSong } from '../../types/Recommendations';
import './RecommendationForm.styles.css';
import { Result } from './RecommendationForm.types';
import { ResultSectionHeader, SearchButton, SearchHint, SearchResult, ShowMoreButton } from './components';
import { useRecommendationSearch } from './useRecommendationSearch';

// Create a stable ID to reduce unnecessary re-renders
// See: https://stackoverflow.com/a/49688084
const SEARCH_INPUT_ID = "song-search-input";
const RESULTS_LIST_ID = "search-results-list";
const DEFAULT_VISIBLE_ITEMS_COUNT = 3;

export type RecommendationFormProps = {
  onRecommend: (
    type: 'song' | 'album' | 'artist',
    recommendation: RecommendedSong | RecommendedAlbum | RecommendedArtist
  ) => void;
};

const RecommendationForm: React.FC<RecommendationFormProps> = ({ onRecommend }) => {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const [activeResultIndex, setActiveResultIndex] = React.useState<number>(-1);

  const {
    searchTerm,
    searchHints,
    results,
    isLoading,
    isAuthenticating,
    isLoadingMore,
    tokenError,
    hasResults,
    isResultsVisible,
    showAllResults,
    inputRef,
    handleHintSelect,
    handleLoadMore,
    handleClearSearch,
    handleResultsVisibility,
    setShowAllResults,
    setSearchTerm,
  } = useRecommendationSearch();

  // Create a wrapper for handleSongSelect that formats the recommendation correctly
  const handleSongSelect = useCallback((result: Result) => {
    if (result.type === 'songs') {
      // Create a Song recommendation
      const songRecommendation: RecommendedSong = {
        songTitle: result.name,
        artistName: result.artist || 'Unknown Artist',
        albumName: result.album || 'Unknown Album',
        albumCoverUrl: result.artworkUrl || placeholderAlbumArt
      };
      onRecommend('song', songRecommendation);
    }
    else if (result.type === 'albums') {
      // Create an Album recommendation
      const albumRecommendation: RecommendedAlbum = {
        albumTitle: result.name,
        artistName: result.artist || 'Unknown Artist',
        albumCoverUrl: result.artworkUrl || placeholderAlbumArt,
        trackCount: result.trackCount
      };
      onRecommend('album', albumRecommendation);
    }
    else if (result.type === 'artists') {
      // Create an Artist recommendation
      const artistRecommendation: RecommendedArtist = {
        artistName: result.name,
        artistImageUrl: result.artworkUrl || placeholderAlbumArt,
        genres: result.genres
      };
      onRecommend('artist', artistRecommendation);
    }

    // Clean up the UI state
    setSearchTerm('');
    handleResultsVisibility(false);
  }, [onRecommend, setSearchTerm, handleResultsVisibility]);

  // Combined results for keyboard navigation
  const allVisibleResults = useMemo(() => {
    const visibleHints = showAllResults ? searchHints : searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT);
    const visibleSongs = showAllResults ? results : results.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT);
    const allResults = [...visibleHints, ...visibleSongs];

    // Add the "Show more" options if applicable
    if (!showAllResults) {
      if (searchHints.length > DEFAULT_VISIBLE_ITEMS_COUNT) allResults.push({ id: 'show-more-hints', name: 'Show more suggestions...', type: 'hint' });
      if (results.length === DEFAULT_VISIBLE_ITEMS_COUNT) allResults.push({ id: 'show-more-results', name: 'Show more results...', type: 'hint' });
    }

    return allResults;
  }, [searchHints, results, showAllResults]);

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
          } else if (selected.id === 'show-more-results') {
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
    if (!searchHints.length) return null;

    return (
      <>
        <ResultSectionHeader title="Suggested Searches" />
        {(showAllResults ? searchHints : searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT)).map((hint, index) => (
          <SearchHint
            key={hint.id}
            hint={hint}
            index={index}
            isActive={index === activeResultIndex}
            onSelect={handleHintSelect}
          />
        ))}
        {!showAllResults && searchHints.length > DEFAULT_VISIBLE_ITEMS_COUNT && (
          <ShowMoreButton
            index={searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT).length}
            isActive={searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT).length === activeResultIndex}
            onClick={() => setShowAllResults(true)}
            text="Show more suggestions..."
          />
        )}
      </>
    );
  }, [searchHints, showAllResults, activeResultIndex, handleHintSelect]);

  // Memoize rendering the song results
  const renderResults = useMemo(() => {
    if (!results.length) return null;

    const hintsCount = searchHints.length;
    const showMoreHints = !showAllResults && hintsCount > DEFAULT_VISIBLE_ITEMS_COUNT;

    return (
      <>
        <ResultSectionHeader title="Search Results" />
        {(showAllResults ? results : results.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT)).map((result, index) => {
          const resultIndex = hintsCount + (showAllResults ? 0 : (showMoreHints ? 1 : 0)) + index;
          return (
            <SearchResult
              key={result.id}
              result={result}
              index={resultIndex}
              isActive={resultIndex === activeResultIndex}
              onSelect={handleSongSelect}
            />
          );
        })}
        {!showAllResults && results.length === DEFAULT_VISIBLE_ITEMS_COUNT && (
          <ShowMoreButton
            index={hintsCount + (showMoreHints ? 1 : 0) + DEFAULT_VISIBLE_ITEMS_COUNT}
            isActive={hintsCount + (showMoreHints ? 1 : 0) + DEFAULT_VISIBLE_ITEMS_COUNT === activeResultIndex}
            onClick={handleLoadMore}
            text="Show more results..."
            isLoading={isLoadingMore}
          />
        )}
      </>
    );
  }, [results, searchHints, showAllResults, activeResultIndex, handleSongSelect, handleLoadMore, isLoadingMore]);

  return (
    <div className="recommendation-form-component styled-container" key="rec-form-container">
      <h1 id="form-title">Make a Recommendation</h1>
      <div className="search-container" ref={searchContainerRef} key="search-container">
        <div className="input-wrapper" key="input-wrapper">
          <label htmlFor={SEARCH_INPUT_ID} className="visually-hidden">
            Search for a song, album, or artist
          </label>
          <input
            ref={inputRef}
            id={SEARCH_INPUT_ID}
            key={SEARCH_INPUT_ID}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a song, album, or artist..."
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
            {renderResults}
          </ul>
        )}
      </div>
    </div>
  );
};

// Memoize the entire component for performance
export default memo(RecommendationForm);
