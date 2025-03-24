/**
 * Represents a music track from Apple Music
 */
export interface Track {
    id: string;
    artistName: string;
    name: string;
    albumName: string;
    genreNames?: string[];
    trackNumber?: number;
    durationInMillis?: number;
    releaseDate?: string;
    isrc?: string;
    artworkUrl?: string;
    composerName?: string;
    url?: string;
    hasLyrics?: boolean;
    isAppleDigitalMaster?: boolean;
    processedTimestamp: string;
    artworkColors?: {
        backgroundColor: string;
        textColor1: string;
        textColor2: string;
        textColor3: string;
        textColor4: string;
    };
}
