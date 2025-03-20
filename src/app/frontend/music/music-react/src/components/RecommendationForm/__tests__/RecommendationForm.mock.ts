// Sample mock search results
export const mockHintResults = [
    { id: 'hint1', name: 'bohemian rhapsody', type: 'hint' },
    { id: 'hint2', name: 'bohemian like you', type: 'hint' },
    { id: 'hint3', name: 'la boheme', type: 'hint' },
    { id: 'hint4', name: 'bohemian style', type: 'hint' },];

export const longMockHintResults = [
    { id: 'supercali-hint1', name: 'supercalifragilisticexpialidocious', type: 'hint' },
    { id: 'supercali-hint2', name: 'supercali', type: 'hint' },
    { id: 'supercali-hint3', name: 'supercalifragilisticexistentialcrisis', type: 'hint' },
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

export const longMockSongResults = [
    {
        id: 'supercali1',
        name: 'Supercalifragilisticexpialidocious',
        artist: 'Julie Andrews, Dick Van Dyke & The Pearly Chorus',
        album: 'Mary Poppins (Original Motion Picture Soundtrack)',
        type: 'songs',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/67/2e/9b/672e9bf3-5683-c815-a11c-891c1ca70afe/00050086070671.rgb.jpg/100x100bb.jpg'
    },
    {
        id: 'supercali2',
        name: 'Supercalifragilisticexpialidocious',
        artist: 'Gavin Lee as Bert, Various Artists, Charlotte Spencer as Jane Banks, Harry Stott as Michael Banks, Laura Michelle Kelly as Mary Poppins, Melanie La Barrie as Mrs Corry & The Original London Cast of Mary Poppins',
        album: 'Mary Poppins (Original London Cast Recording)',
        type: 'songs',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/f2/96/61/f296613e-524f-4dfa-2df6-4e20f05f18aa/00050086139170.rgb.jpg/100x100bb.jpg'
    },
    {
        id: 'supercali3',
        name: 'Supercalifragilisticexpialidocious (Live)',
        artist: 'The Australian Cast of Mary Poppins',
        album: 'Mary Poppins: The Supercalifragilistic Musical (Original Live Cast Recording)',
        type: 'songs',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/51/e8/4c/51e84ca6-5502-1aae-d395-93559e32bb27/00050087238704.rgb.jpg/100x100bb.jpg'
    }
];

// Setup mock API responses
export const mockApiResponse = {
    termSuggestions: mockHintResults,
    contentResults: mockSongResults
};

// Extra Mary Poppins related test data
export const mockSuperCalifragilisticApiResponse = {
    termSuggestions: mockHintResults.filter(hint =>
        hint.name.includes('supercali')
    ),
    contentResults: mockSongResults.filter(song =>
        song.id.includes('supercali')
    )
};