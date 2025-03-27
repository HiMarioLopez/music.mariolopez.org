/**
 * Utility functions for accessibility
 */

/**
 * Gets appropriate label for screen readers based on item properties
 * @param item Object containing potential label properties
 * @returns String label for accessibility purposes
 */
export function getItemLabel<T extends Record<string, any>>(item: T): string {
  if (typeof item === "object" && item !== null) {
    if ("songTitle" in item) {
      return item.songTitle;
    } else if ("albumTitle" in item) {
      return item.albumTitle;
    } else if ("artistName" in item) {
      return item.artistName;
    }
  }
  return "item";
}

/**
 * Gets an item's ID or generates a fallback based on index
 * @param item Object that may contain an id property
 * @param index Fallback index to use if no id is found
 * @returns String identifier for the item
 */
export function getItemId<T>(item: T, index: number): string {
  if (typeof item === "object" && item !== null && "id" in item) {
    return (item as any).id;
  }
  return `index_${index}`;
}

/**
 * Handles keyboard navigation for search inputs with dropdown results
 * @param e Keyboard event from onKeyDown
 * @param options Configuration options for the keyboard handler
 * @returns void
 */
export function handleSearchInputKeyDown<T>(
  e: React.KeyboardEvent<HTMLInputElement>,
  options: {
    isResultsVisible: boolean;
    hasResults: boolean;
    allVisibleResults: T[];
    activeResultIndex: number;
    setActiveResultIndex: React.Dispatch<React.SetStateAction<number>>;
    setShowAllResults?: React.Dispatch<React.SetStateAction<boolean>>;
    handleResultsVisibility: (visible: boolean) => void;
    handleHintSelect?: (term: string) => void;
    handleItemSelect?: (result: T) => void;
    handleLoadMore?: () => void;
  },
): void {
  const {
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
  } = options;

  if (!isResultsVisible || !hasResults) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setActiveResultIndex(
        (prevIndex: number) =>
          prevIndex < allVisibleResults.length - 1 ? prevIndex + 1 : 0, // Cycle to top when at bottom
      );
      break;
    case "ArrowUp":
      e.preventDefault();
      setActiveResultIndex(
        (prevIndex: number) =>
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
        const selected = allVisibleResults[activeResultIndex] as any;

        // Reset active index first for all actions
        setActiveResultIndex(-1);

        if (selected.id === "show-more-hints" && setShowAllResults) {
          setShowAllResults(true);
        } else if (selected.id === "show-more-results" && handleLoadMore) {
          handleLoadMore();
        } else if (selected.type === "hint" && handleHintSelect) {
          handleHintSelect(selected.name);
        } else if (handleItemSelect) {
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
}
