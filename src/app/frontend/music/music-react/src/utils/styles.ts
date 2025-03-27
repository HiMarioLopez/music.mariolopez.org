/**
 * Utility functions for style helpers
 */

/**
 * Determines the appropriate class name based on the recommendation type
 * @param item Object containing properties that determine its type
 * @returns CSS class name string
 */
export function getItemClassName<T>(item: T): string {
  if (typeof item === "object" && item !== null) {
    if ("songTitle" in item) {
      return "song-item";
    } else if ("albumTitle" in item) {
      return "album-item";
    } else if ("artistName" in item) {
      return "artist-item";
    }
  }
  return "recommendation-item";
}
