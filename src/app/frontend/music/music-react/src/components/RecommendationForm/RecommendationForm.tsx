import React, {
  FormEvent,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import placeholderAlbumArt from "../../assets/50.png";
import { useRecommendations } from "../../context/RecommendationsContext";
import {
  RecommendedAlbum,
  RecommendedArtist,
  RecommendedSong,
} from "../../types/Recommendations";
import "./styles/RecommendationForm.styles.css";
import { Result } from "./hooks/RecommendationForm.types";
import { useRecommendationSearch } from "./hooks/useRecommendationSearch";
import ResultSectionHeader from "./components/ResultSectionHeader";
import SearchButton from "./components/SearchButton";
import SearchHint from "./components/SearchHint";
import SearchResult from "./components/SearchResult";
import ShowMoreButton from "./components/ShowMoreButton";

// Create a stable ID to reduce unnecessary re-renders
// See: https://stackoverflow.com/a/49688084
const SEARCH_INPUT_ID = "song-search-input";
const RESULTS_LIST_ID = "search-results-list";
const DEFAULT_VISIBLE_ITEMS_COUNT = 3;

const RecommendationForm: React.FC = () => {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const [activeResultIndex, setActiveResultIndex] = React.useState<number>(-1);
  const [from, setFrom] = useState("");
  const [note, setNote] = useState("");
  const [selectedItem, setSelectedItem] = useState<Result | null>(null);
  const [formErrors, setFormErrors] = useState<{
    from?: string;
    note?: string;
    selectedItem?: string;
  }>({});
  const [isFormExpanded, setIsFormExpanded] = useState(false);

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

  // Use the recommendations context
  const { addRecommendation } = useRecommendations();

  // Modified to set the selected item rather than submitting directly
  const handleItemSelect = useCallback(
    (result: Result) => {
      setSelectedItem(result);
      setSearchTerm("");
      handleResultsVisibility(false);
    },
    [setSearchTerm, handleResultsVisibility],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const errors: { from?: string; note?: string; selectedItem?: string } =
        {};

      // Validate selected item
      if (!selectedItem) {
        errors.selectedItem = "Please select an item to recommend";
      }

      // Validate "from" field - only check length if provided
      if (from.trim() && from.length > 32) {
        errors.from = "Name must be 32 characters or less";
      }

      // Validate note field - only check length if provided
      if (note.trim() && note.length > 512) {
        errors.note = "Note must be 512 characters or less";
      }

      // If there are errors, show them and return
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);

        // If there are errors in the form fields, expand the form section
        if (errors.from || errors.note) {
          setIsFormExpanded(true);
        }

        return;
      }

      // Clear any previous errors
      setFormErrors({});

      // Must have a selected item at this point
      if (!selectedItem) return;

      // Process the recommendation based on the type
      if (selectedItem.type === "songs") {
        // Create a Song recommendation
        const songRecommendation: RecommendedSong = {
          songTitle: selectedItem.name,
          artistName: selectedItem.artist || "Unknown Artist",
          albumName: selectedItem.album || "Unknown Album",
          albumCoverUrl: selectedItem.artworkUrl || placeholderAlbumArt,
          from: from.trim(),
          note: note.trim() || undefined,
        };
        addRecommendation("songs", songRecommendation);
      } else if (selectedItem.type === "albums") {
        // Create an Album recommendation
        const albumRecommendation: RecommendedAlbum = {
          albumTitle: selectedItem.name,
          artistName: selectedItem.artist || "Unknown Artist",
          albumCoverUrl: selectedItem.artworkUrl || placeholderAlbumArt,
          trackCount: selectedItem.trackCount,
          from: from.trim(),
          note: note.trim() || undefined,
        };
        addRecommendation("albums", albumRecommendation);
      } else if (selectedItem.type === "artists") {
        // Create an Artist recommendation
        const artistRecommendation: RecommendedArtist = {
          artistName: selectedItem.name,
          artistImageUrl: selectedItem.artworkUrl || placeholderAlbumArt,
          genres: selectedItem.genres || [],
          from: from.trim(),
          note: note.trim() || undefined,
        };
        addRecommendation("artists", artistRecommendation);
      }

      // Reset form after submission
      setSelectedItem(null);
      setFrom("");
      setNote("");
      setSearchTerm("");
      setIsFormExpanded(false);
    },
    [addRecommendation, from, note, selectedItem, setSearchTerm],
  );

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Combined results for keyboard navigation
  const allVisibleResults = useMemo(() => {
    const visibleHints = showAllResults
      ? searchHints
      : searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT);
    const visibleSongs = showAllResults
      ? results
      : results.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT);
    const allResults = [...visibleHints, ...visibleSongs];

    // Add the "Show more" options if applicable
    if (!showAllResults) {
      if (searchHints.length > DEFAULT_VISIBLE_ITEMS_COUNT)
        allResults.push({
          id: "show-more-hints",
          name: "Show more suggestions...",
          type: "hint",
        });
      if (results.length === DEFAULT_VISIBLE_ITEMS_COUNT)
        allResults.push({
          id: "show-more-results",
          name: "Show more results...",
          type: "hint",
        });
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isResultsVisible || !hasResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveResultIndex(
          (prevIndex) =>
            prevIndex < allVisibleResults.length - 1 ? prevIndex + 1 : 0, // Cycle to top when at bottom
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveResultIndex(
          (prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : allVisibleResults.length - 1, // Cycle to bottom when at top
        );
        break;
      case "Home":
        e.preventDefault();
        setActiveResultIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveResultIndex(allVisibleResults.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (
          activeResultIndex >= 0 &&
          activeResultIndex < allVisibleResults.length
        ) {
          const selected = allVisibleResults[activeResultIndex];

          // Reset active index first for all actions
          setActiveResultIndex(-1);

          if (selected.id === "show-more-hints") {
            setShowAllResults(true);
          } else if (selected.id === "show-more-results") {
            handleLoadMore();
          } else if (selected.type === "hint") {
            handleHintSelect(selected.name);
          } else {
            handleItemSelect(selected);
          }
        }
        break;
      case "Escape":
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
      const activeItem = resultsRef.current.querySelector(
        `li[data-index="${activeResultIndex}"]`,
      );
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
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

  // Toggle form expanded state
  const toggleFormExpanded = useCallback(() => {
    setIsFormExpanded((prev) => !prev);
  }, []);

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
        {(showAllResults
          ? searchHints
          : searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT)
        ).map((hint, index) => (
          <SearchHint
            key={hint.id}
            hint={hint}
            index={index}
            isActive={index === activeResultIndex}
            onSelect={handleHintSelect}
          />
        ))}
        {!showAllResults &&
          searchHints.length > DEFAULT_VISIBLE_ITEMS_COUNT && (
            <ShowMoreButton
              index={searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT).length}
              isActive={
                searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT).length ===
                activeResultIndex
              }
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
    const showMoreHints =
      !showAllResults && hintsCount > DEFAULT_VISIBLE_ITEMS_COUNT;

    return (
      <>
        <ResultSectionHeader title="Search Results" />
        {(showAllResults
          ? results
          : results.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT)
        ).map((result, index) => {
          const resultIndex =
            hintsCount + (showAllResults ? 0 : showMoreHints ? 1 : 0) + index;
          return (
            <SearchResult
              key={result.id}
              result={result}
              index={resultIndex}
              isActive={resultIndex === activeResultIndex}
              onSelect={handleItemSelect}
            />
          );
        })}
        {!showAllResults && results.length === DEFAULT_VISIBLE_ITEMS_COUNT && (
          <ShowMoreButton
            index={
              hintsCount + (showMoreHints ? 1 : 0) + DEFAULT_VISIBLE_ITEMS_COUNT
            }
            isActive={
              hintsCount +
                (showMoreHints ? 1 : 0) +
                DEFAULT_VISIBLE_ITEMS_COUNT ===
              activeResultIndex
            }
            onClick={handleLoadMore}
            text="Show more results..."
            isLoading={isLoadingMore}
          />
        )}
      </>
    );
  }, [
    results,
    searchHints,
    showAllResults,
    activeResultIndex,
    handleItemSelect,
    handleLoadMore,
    isLoadingMore,
  ]);

  // Render the selected item preview
  const renderSelectedItem = useMemo(() => {
    if (!selectedItem) return null;

    return (
      <div className="selected-item-preview">
        <div className="selected-item-image">
          <img
            className="preview-artwork"
            src={selectedItem.artworkUrl || placeholderAlbumArt}
            alt={`${selectedItem.name} artwork`}
          />
        </div>
        <div className="selected-item-details">
          <h3 title={selectedItem.name}>{selectedItem.name}</h3>
          {selectedItem.artist && (
            <p title={selectedItem.artist}>By {selectedItem.artist}</p>
          )}
          {selectedItem.album && (
            <p title={selectedItem.album}>From {selectedItem.album}</p>
          )}
          <div className="item-type">
            {selectedItem.type?.replace(/s$/, "")}
          </div>
        </div>
        <button
          type="button"
          className="clear-selection-button"
          onClick={handleClearSelection}
          aria-label={`Clear ${selectedItem.name} selection`}
        >
          ×
        </button>
      </div>
    );
  }, [selectedItem, handleClearSelection]);

  return (
    <div className="recommendation-form-component" key="rec-form-container">
      <h1 id="form-title">Make a Recommendation</h1>
      <div
        className="search-container"
        ref={searchContainerRef}
        key="search-container"
      >
        <form onSubmit={handleSubmit} className="recommendation-form">
          <div className="form-field">
            <div className="input-wrapper" key="input-wrapper">
              <input
                ref={inputRef}
                id={SEARCH_INPUT_ID}
                key={SEARCH_INPUT_ID}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a song, album, or artist..."
                disabled={isAuthenticating}
                onFocus={() => hasResults && handleResultsVisibility(true)}
                aria-describedby={
                  hasResults && isResultsVisible ? RESULTS_LIST_ID : undefined
                }
                aria-expanded={hasResults && isResultsVisible}
                aria-autocomplete="list"
                aria-controls={hasResults ? RESULTS_LIST_ID : undefined}
                aria-activedescendant={
                  activeResultIndex >= 0
                    ? `result-${activeResultIndex}`
                    : undefined
                }
                aria-busy={isLoading || isAuthenticating}
                autoComplete="off"
                className={formErrors.selectedItem ? "error" : ""}
              />
              <SearchButton
                isLoading={isLoading}
                isAuthenticating={isAuthenticating}
                searchTerm={searchTerm}
                onClear={handleInputClear}
                disabled={isAuthenticating}
              />
            </div>
            {formErrors.selectedItem && (
              <div className="error-message">{formErrors.selectedItem}</div>
            )}
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

          {renderSelectedItem}

          <div className="collapsible-form-section">
            <button
              type="button"
              className={`collapsible-toggle ${
                isFormExpanded ? "expanded" : ""
              }`}
              onClick={toggleFormExpanded}
              aria-expanded={isFormExpanded}
              aria-controls="form-fields-container"
            >
              <span>Note (Optional)</span>
              <span className="toggle-icon">▲</span>
            </button>

            <div
              id="form-fields-container"
              className={`form-fields-container ${
                isFormExpanded ? "expanded" : ""
              }`}
              aria-hidden={!isFormExpanded}
            >
              <div className="form-field">
                <div className="label-counter-row">
                  <label htmlFor="recommendation-from">From (Optional)</label>
                  <div className="char-counter">{from.length}/32</div>
                </div>
                <input
                  id="recommendation-from"
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  maxLength={32}
                  className={formErrors.from ? "error" : ""}
                />
                {formErrors.from && (
                  <div className="error-message">{formErrors.from}</div>
                )}
              </div>

              <div className="form-field">
                <div className="label-counter-row">
                  <label htmlFor="recommendation-note">Note (Optional)</label>
                  <div className="char-counter">{note.length}/512</div>
                </div>
                <textarea
                  id="recommendation-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={512}
                  rows={2}
                  className={formErrors.note ? "error" : ""}
                />
                {formErrors.note && (
                  <div className="error-message">{formErrors.note}</div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={!selectedItem}
            >
              Submit Recommendation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Memoize the entire component for performance
export default memo(RecommendationForm);
