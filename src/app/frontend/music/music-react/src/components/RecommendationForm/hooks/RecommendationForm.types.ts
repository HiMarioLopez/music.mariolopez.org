export type Result = {
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

// New type for the recommendation form data
export type RecommendationFormData = {
    from: string;
    note: string;
    selectedItem: Result | null;
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

export type Hint = {
    kind: 'terms' | 'topResults';
    searchTerm?: string;
    displayTerm?: string;
    content?: TopResult;
};
