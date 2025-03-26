export type RecommendedSong = {
    id?: string;
    songTitle: string;
    artistName: string;
    albumName: string;
    albumCoverUrl: string;
    votes?: number;
    userVoted?: 'up' | 'down';
    from?: string;
    note?: string;
};

export type RecommendedAlbum = {
    id?: string;
    albumTitle: string;
    artistName: string;
    albumCoverUrl: string;
    trackCount?: number;
    releaseDate?: string;
    votes?: number;
    userVoted?: 'up' | 'down';
    from?: string;
    note?: string;
};

export type RecommendedArtist = {
    id?: string;
    artistName: string;
    artistImageUrl: string;
    genres?: string[];
    votes?: number;
    userVoted?: 'up' | 'down';
    from?: string;
    note?: string;
}; 