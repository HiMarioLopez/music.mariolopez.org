export type SearchResult = {
    id: string;
    name: string;
    artist?: string;
    album?: string;
    type?: 'songs' | 'albums' | 'artists' | 'hint';
    artworkUrl?: string;
    // Album specific fields
    trackCount?: number;
    releaseDate?: string;
    // Artist specific fields
    genres?: string[];
}

export type TopResult = {
    id: string;
    type: 'songs' | 'albums' | 'artists';
    attributes: {
        name: string;
        artistName?: string;
        albumName?: string;
        artwork?: {
            url: string;
        };
        genreNames?: string[];
        releaseDate?: string;
        trackCount?: number;
    };
};

export type SearchSuggestion = {
    kind: 'terms' | 'topResults';
    searchTerm?: string;
    displayTerm?: string;
    content?: TopResult;
};
