/**
 * Represents the music streaming platform source
 */
export type MusicSource = "apple" | "spotify" | "unknown";

/**
 * Type guard to check if a string is a valid MusicSource
 */
export function isMusicSource(value: unknown): value is MusicSource {
  return value === "apple" || value === "spotify" || value === "unknown";
}

/**
 * Gets a display name for a music source
 */
export function getMusicSourceDisplayName(source: MusicSource): string {
  switch (source) {
    case "apple":
      return "Apple Music";
    case "spotify":
      return "Spotify";
    case "unknown":
      return "Unknown Source";
  }
}
