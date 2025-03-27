import { ReactNode } from 'react';
import { vi } from 'vitest';
import { MusicItem } from '../../context/MusicContext';

// Mock for the MusicContext with proper types
export const createMockMusicItem = (overrides = {}): MusicItem => ({
  processedTimestamp: new Date().toISOString(),
  isrc: 'mock-isrc',
  durationInMillis: 180000,
  composerName: 'Mock Composer',
  trackId: 'mock-track-id',
  url: 'https://example.com/track',
  genreNames: ['Mock Genre'],
  name: 'Mock Track',
  hasLyrics: false,
  trackNumber: 1,
  releaseDate: '2023-01-01',
  artworkColors: {
    textColor1: '#FFFFFF',
    backgroundColor: '#000000',
    textColor4: '#CCCCCC',
    textColor2: '#EEEEEE',
    textColor3: '#DDDDDD',
  },
  albumName: 'Mock Album',
  isAppleDigitalMaster: false,
  id: 'mock-id',
  artworkUrl: 'https://example.com/artwork.jpg',
  artistName: 'Mock Artist',
  ...overrides,
});

export const createMockMusicContext = (overrides = {}) => ({
  nowPlaying: null,
  recentlyPlayed: [],
  loading: false,
  error: null,
  refreshMusicHistory: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Create a mock provider that will set up the context for testing
export const MockMusicProvider = ({
  children,
  contextValue = createMockMusicContext(),
}: {
  children: ReactNode;
  contextValue?: ReturnType<typeof createMockMusicContext>;
}) => {
  // Mock the useMusicContext hook before rendering
  vi.mock('../../context/MusicContext', () => ({
    useMusicContext: () => contextValue,
  }));

  return <>{children}</>;
};
