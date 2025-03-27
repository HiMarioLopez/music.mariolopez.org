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
