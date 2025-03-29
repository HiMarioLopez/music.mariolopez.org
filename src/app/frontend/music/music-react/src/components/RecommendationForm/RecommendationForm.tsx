import React, {
  FormEvent,
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
import { Result } from "./types/RecommendationForm.types";
import { useRecommendationSearch } from "./hooks/useRecommendationSearch";
import SearchButton from "./components/SearchButton";
import SelectedItemDisplay from "./components/SelectedItemDisplay";
import SearchInput from "./components/SearchInput";
import ResultsList from "./components/ResultsList";
import CollapsibleFormSection from "./components/CollapsibleFormSection";
import FormActions from "./components/FormActions";

// Create a stable ID to reduce unnecessary re-renders
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
        // Create a Song recommendation with notes array
        const songRecommendation: RecommendedSong = {
          songTitle: selectedItem.name,
          artistName: selectedItem.artist || "Unknown Artist",
          albumName: selectedItem.album || "Unknown Album",
          albumCoverUrl: selectedItem.artworkUrl || placeholderAlbumArt,
          notes: from.trim()
            ? [
                {
                  from: from.trim(),
                  note: note.trim() || "",
                  noteTimestamp: new Date().toISOString(),
                },
              ]
            : [],
        };
        addRecommendation("songs", songRecommendation);
      } else if (selectedItem.type === "albums") {
        // Create an Album recommendation with notes array
        const albumRecommendation: RecommendedAlbum = {
          albumTitle: selectedItem.name,
          artistName: selectedItem.artist || "Unknown Artist",
          albumCoverUrl: selectedItem.artworkUrl || placeholderAlbumArt,
          trackCount: selectedItem.trackCount,
          notes: from.trim()
            ? [
                {
                  from: from.trim(),
                  note: note.trim() || "",
                  noteTimestamp: new Date().toISOString(),
                },
              ]
            : [],
        };
        addRecommendation("albums", albumRecommendation);
      } else if (selectedItem.type === "artists") {
        // Create an Artist recommendation with notes array
        const artistRecommendation: RecommendedArtist = {
          artistName: selectedItem.name,
          artistImageUrl: selectedItem.artworkUrl || placeholderAlbumArt,
          genres: selectedItem.genres || [],
          notes: from.trim()
            ? [
                {
                  from: from.trim(),
                  note: note.trim() || "",
                  noteTimestamp: new Date().toISOString(),
                },
              ]
            : [],
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

  // Handle clicks outside
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

  return (
    <div className="recommendation-form-component">
      <h1>Make a Recommendation</h1>
      <form onSubmit={handleSubmit}>
        <div className="search-container" ref={searchContainerRef}>
          {selectedItem ? (
            <div className="selected-item-wrapper">
              <SelectedItemDisplay selectedItem={selectedItem} />
              <SearchButton
                isLoading={false}
                isAuthenticating={false}
                searchTerm="x" // Any non-empty string to trigger clear mode
                onClear={handleClearSelection}
                disabled={false}
              />
            </div>
          ) : (
            <SearchInput
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isResultsVisible={isResultsVisible}
              handleResultsVisibility={handleResultsVisibility}
              activeResultIndex={activeResultIndex}
              setActiveResultIndex={setActiveResultIndex}
              allVisibleResults={allVisibleResults}
              isLoading={isLoading}
              isAuthenticating={isAuthenticating}
              hasResults={hasResults}
              handleClearSearch={handleClearSearch}
              handleHintSelect={handleHintSelect}
              handleItemSelect={handleItemSelect}
              handleLoadMore={handleLoadMore}
              setShowAllResults={setShowAllResults}
            />
          )}
          {formErrors.selectedItem && !selectedItem && (
            <div className="error-text">{formErrors.selectedItem}</div>
          )}
          {isResultsVisible && !selectedItem && (
            <ResultsList
              ref={resultsRef}
              searchHints={searchHints}
              results={results}
              showAllResults={showAllResults}
              setShowAllResults={setShowAllResults}
              handleHintSelect={handleHintSelect}
              handleItemSelect={handleItemSelect}
              handleLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
              isLoading={isLoading}
              tokenError={tokenError}
              searchTerm={searchTerm}
              activeResultIndex={activeResultIndex}
            />
          )}
        </div>

        <CollapsibleFormSection
          isFormExpanded={isFormExpanded}
          setIsFormExpanded={setIsFormExpanded}
          from={from}
          setFrom={setFrom}
          note={note}
          setNote={setNote}
          formErrors={{
            from: formErrors.from,
            note: formErrors.note,
          }}
        />

        <FormActions selectedItem={selectedItem} />
      </form>
    </div>
  );
};

// Memoize the entire component for performance
export default memo(RecommendationForm);
