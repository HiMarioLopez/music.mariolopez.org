/**
 * Utility functions for formatting and processing data
 */

/**
 * Formats a number with commas as thousand separators
 * @param num Number to format
 * @returns Formatted number string with commas
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Formats a timestamp into a relative time string
 * @param timestamp Timestamp to format
 * @returns Relative time string (e.g., "just now", "2 mins ago", "1 hour ago", "3 days ago")
 */
export const formatRelativeTime = (timestamp: string): string => {
  if (!timestamp) return "";

  const now = new Date();
  const playedTime = new Date(timestamp);
  const timeDiffMs = now.getTime() - playedTime.getTime();

  // Convert to seconds
  const seconds = Math.floor(timeDiffMs / 1000);

  if (seconds < 60) {
    return "just now";
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
};
