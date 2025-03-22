export type RecommendedSong = {
    songTitle: string;
    artistName: string;
    albumName: string;
    albumCoverUrl: string;
    votes?: number;
};

export type RecommendedAlbum = {
    albumTitle: string;
    artistName: string;
    albumCoverUrl: string;
    trackCount?: number;
    releaseDate?: string;
    votes?: number;
};

export type RecommendedArtist = {
    artistName: string;
    artistImageUrl: string;
    genres?: string[];
    votes?: number;
}; 