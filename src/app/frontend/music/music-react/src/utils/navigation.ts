/**
 * Utility functions for navigation and external links
 */

/**
 * Opens a URL in a new window/tab with proper security attributes
 * @param url The URL to open
 */
export const openUrlInNewTab = (url: string | undefined): void => {
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};
