// Sample mock search results
export const mockHintResults = [
    { id: 'hint1', name: 'bohemian rhapsody', type: 'hint' },
    { id: 'hint2', name: 'bohemian like you', type: 'hint' },
    { id: 'hint3', name: 'la boheme', type: 'hint' },
    { id: 'hint4', name: 'bohemian style', type: 'hint' },
];

export const mockSongResults = [
    {
        id: 'song1',
        name: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        type: 'songs',
        artworkUrl: 'https://example.com/artwork1.jpg'
    },
    {
        id: 'song2',
        name: 'Bohemian Like You',
        artist: 'The Dandy Warhols',
        album: 'Thirteen Tales from Urban Bohemia',
        type: 'songs',
        artworkUrl: 'https://example.com/artwork2.jpg'
    },
    {
        id: 'song3',
        name: 'La Bohème',
        artist: 'Charles Aznavour',
        album: 'La Bohème',
        type: 'songs',
        artworkUrl: 'https://example.com/artwork3.jpg'
    }
];

// Setup mock API responses
export const mockApiResponse = {
    termSuggestions: mockHintResults,
    contentResults: mockSongResults
};