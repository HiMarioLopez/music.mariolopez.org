import React from "react";
import SearchButton from "./SearchButton";
import { Result } from "../types/RecommendationForm.types";
import { handleSearchInputKeyDown } from "../../../utils/accessibility";
import "../styles/SearchInput.styles.css";

// Create a stable ID to reduce unnecessary re-renders
const SEARCH_INPUT_ID = "song-search-input";
const RESULTS_LIST_ID = "search-results-list";

interface SearchInputProps {
  inputRef: React.RefObject<HTMLInputElement> | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isResultsVisible: boolean;
  handleResultsVisibility: (visible: boolean) => void;
  activeResultIndex: number;
  setActiveResultIndex: React.Dispatch<React.SetStateAction<number>>;
  allVisibleResults: Result[];
  isLoading: boolean;
  isAuthenticating: boolean;
  hasResults: boolean;
  handleClearSearch: () => void;
  handleHintSelect: (term: string) => void;
  handleItemSelect: (result: Result) => void;
  handleLoadMore: () => void;
  setShowAllResults: React.Dispatch<React.SetStateAction<boolean>>;
}

const SearchInput: React.FC<SearchInputProps> = ({
  inputRef,
  searchTerm,
  setSearchTerm,
  isResultsVisible,
  handleResultsVisibility,
  activeResultIndex,
  setActiveResultIndex,
  allVisibleResults,
  isLoading,
  isAuthenticating,
  hasResults,
  handleClearSearch,
  handleHintSelect,
  handleItemSelect,
  handleLoadMore,
  setShowAllResults,
}) => {
  return (
    <div className="input-wrapper">
      <input
        ref={inputRef}
        id={SEARCH_INPUT_ID}
        type="text"
        placeholder="Search for a song, album, or artist"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => {
          handleResultsVisibility(!!searchTerm && searchTerm.length > 1);
        }}
        aria-expanded={isResultsVisible}
        aria-owns={isResultsVisible ? RESULTS_LIST_ID : undefined}
        aria-autocomplete="list"
        role="combobox"
        aria-controls={RESULTS_LIST_ID}
        aria-activedescendant={
          activeResultIndex >= 0 ? `result-${activeResultIndex}` : undefined
        }
        autoComplete="off"
        onKeyDown={(e) =>
          handleSearchInputKeyDown(e, {
            isResultsVisible,
            hasResults,
            allVisibleResults,
            activeResultIndex,
            setActiveResultIndex,
            setShowAllResults,
            handleResultsVisibility,
            handleHintSelect,
            handleItemSelect,
            handleLoadMore,
          })
        }
      />
      <SearchButton
        isLoading={isLoading}
        isAuthenticating={isAuthenticating}
        searchTerm={searchTerm}
        onClear={handleClearSearch}
        disabled={isAuthenticating}
      />
    </div>
  );
};

export default React.memo(SearchInput);
