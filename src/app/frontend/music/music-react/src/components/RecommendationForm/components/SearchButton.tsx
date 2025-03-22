import React, { memo } from "react";
import { LoadingIcon, ClearIcon, SearchIcon } from "../../Icons";

type SearchButtonProps = {
  isLoading: boolean;
  isAuthenticating: boolean;
  searchTerm: string;
  onClear: () => void;
  disabled: boolean;
};

const SearchButton: React.FC<SearchButtonProps> = ({
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
);

export default memo(SearchButton);
