type ApiResponse = {
    data: SearchResult;
};

type SearchResult = {
    results: {
        suggestions: Suggestion[];
    };
};

type Suggestion = {
    kind: string;
    content: Content;
};

type Content = {
    id: string;
    type: string;
    href: string;
    attributes: SongAttributes;
};

type SongAttributes = {
    albumName: string;
    genreNames: string[];
    trackNumber: number;
    durationInMillis: number;
    releaseDate: string;
    isrc: string;
    artwork: Artwork;
    composerName: string;
    playParams: PlayParams;
    url: string;
    discNumber: number;
    hasCredits: boolean;
    isAppleDigitalMaster: boolean;
    hasLyrics: boolean;
    name: string;
    previews: Preview[];
    artistName: string;
    contentRating?: 'explicit' | 'clean';
};

type Artwork = {
    width: number;
    height: number;
    url: string;
    bgColor?: string;
    textColor1?: string;
    textColor2?: string;
    textColor3?: string;
    textColor4?: string;
};

type PlayParams = {
    id: string;
    kind: string;
};

type Preview = {
    url: string;
};
