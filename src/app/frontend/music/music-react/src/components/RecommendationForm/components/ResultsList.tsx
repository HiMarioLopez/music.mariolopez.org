import React from "react";
import { Result } from "../types/RecommendationForm.types";
import ResultSectionHeader from "./ResultSectionHeader";
import SearchHint from "./SearchHint";
import SearchResult from "./SearchResult";
import ShowMoreButton from "./ShowMoreButton";
import "../styles/ResultsList.styles.css";

const RESULTS_LIST_ID = "search-results-list";
const DEFAULT_VISIBLE_ITEMS_COUNT = 3;

interface ResultsListProps {
  searchHints: Result[];
  results: Result[];
  showAllResults: boolean;
  setShowAllResults: (show: boolean) => void;
  handleHintSelect: (term: string) => void;
  handleItemSelect: (result: Result) => void;
  handleLoadMore: () => void;
  isLoadingMore: boolean;
  isLoading: boolean;
  tokenError: string | null;
  searchTerm: string;
  activeResultIndex: number;
}

const ResultsList = React.forwardRef<HTMLUListElement, ResultsListProps>(
  (
    {
      searchHints,
      results,
      showAllResults,
      setShowAllResults,
      handleHintSelect,
      handleItemSelect,
      handleLoadMore,
      isLoadingMore,
      isLoading,
      tokenError,
      searchTerm,
      activeResultIndex,
    },
    ref,
  ) => {
    return (
      <ul
        id={RESULTS_LIST_ID}
        className="search-results"
        role="listbox"
        ref={ref}
        tabIndex={-1}
      >
        {/* Render hints if available */}
        {searchHints.length > 0 && (
          <>
            <ResultSectionHeader title="Search Suggestions" />
            {(showAllResults
              ? searchHints
              : searchHints.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT)
            ).map((hint, index) => (
              <SearchHint
                key={`hint-${hint.id}`}
                hint={hint}
                index={index}
                isActive={activeResultIndex === index}
                onSelect={handleHintSelect}
              />
            ))}
            {!showAllResults &&
              searchHints.length > DEFAULT_VISIBLE_ITEMS_COUNT && (
                <ShowMoreButton
                  onClick={() => setShowAllResults(true)}
                  text="Show more suggestions..."
                  index={searchHints.length}
                  isActive={activeResultIndex === searchHints.length}
                />
              )}
          </>
        )}

        {/* Render the search results */}
        {results.length > 0 && (
          <>
            <ResultSectionHeader title="Results" />
            {(showAllResults
              ? results
              : results.slice(0, DEFAULT_VISIBLE_ITEMS_COUNT)
            ).map((result, index) => (
              <SearchResult
                key={`${result.type}-${result.id}`}
                result={result}
                index={searchHints.length + index}
                isActive={activeResultIndex === searchHints.length + index}
                onSelect={handleItemSelect}
              />
            ))}
            {!showAllResults &&
              results.length === DEFAULT_VISIBLE_ITEMS_COUNT && (
                <ShowMoreButton
                  onClick={handleLoadMore}
                  text="Show more results..."
                  isLoading={isLoadingMore}
                  index={searchHints.length + results.length}
                  isActive={
                    activeResultIndex === searchHints.length + results.length
                  }
                />
              )}
          </>
        )}

        {/* Error and loading states */}
        {tokenError && (
          <li className="error-message">
            <span>{tokenError}</span>
          </li>
        )}
        {isLoading &&
          !isLoadingMore &&
          !results.length &&
          !searchHints.length && (
            <li>
              <span>Searching...</span>
            </li>
          )}
        {!isLoading &&
          !tokenError &&
          !results.length &&
          !searchHints.length &&
          searchTerm.length > 1 && (
            <li>
              <span>No results found</span>
            </li>
          )}
      </ul>
    );
  },
);

ResultsList.displayName = "ResultsList";

export default React.memo(ResultsList);
