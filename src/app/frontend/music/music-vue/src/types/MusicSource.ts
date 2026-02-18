export type MusicSource = "apple" | "spotify" | "unknown";

export function isMusicSource(value: unknown): value is MusicSource {
  return value === "apple" || value === "spotify" || value === "unknown";
}

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
