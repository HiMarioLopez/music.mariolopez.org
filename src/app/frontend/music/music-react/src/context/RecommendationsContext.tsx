import React, { createContext, useReducer, useContext, ReactNode, useCallback, useMemo } from 'react';
import { RecommendedSong, RecommendedAlbum, RecommendedArtist } from '../types/Recommendations';
import placeholderAlbumArt from '../assets/50.png';

// Define the context state shape
type RecommendationsState = {
  songs: {
    items: RecommendedSong[];
    loading: boolean;
    error: string | null;
    loaded: boolean;
  };
  albums: {
    items: RecommendedAlbum[];
    loading: boolean;
    error: string | null;
    loaded: boolean;
  };
  artists: {
    items: RecommendedArtist[];
    loading: boolean;
    error: string | null;
    loaded: boolean;
  };
};

// Define action types
type RecommendationsAction =
  | { type: 'FETCH_RECOMMENDATIONS_REQUEST'; recommendationType: 'songs' | 'albums' | 'artists' }
  | { type: 'FETCH_RECOMMENDATIONS_SUCCESS'; recommendationType: 'songs' | 'albums' | 'artists'; items: RecommendedSong[] | RecommendedAlbum[] | RecommendedArtist[] }
  | { type: 'FETCH_RECOMMENDATIONS_FAILURE'; recommendationType: 'songs' | 'albums' | 'artists'; error: string }
  | { type: 'ADD_RECOMMENDATION'; recommendationType: 'songs' | 'albums' | 'artists'; item: RecommendedSong | RecommendedAlbum | RecommendedArtist }
  | { type: 'UPVOTE_RECOMMENDATION'; recommendationType: 'songs' | 'albums' | 'artists'; index: number };

// Define the context API shape
type RecommendationsContextType = {
  state: RecommendationsState;
  fetchRecommendations: (type: 'songs' | 'albums' | 'artists') => void;
  addRecommendation: (type: 'songs' | 'albums' | 'artists', item: RecommendedSong | RecommendedAlbum | RecommendedArtist) => void;
  upvoteRecommendation: (type: 'songs' | 'albums' | 'artists', index: number) => void;
};

// Create mock data for initial state
const mockSongs: RecommendedSong[] = [
  {
    songTitle: 'Bohemian Rhapsody',
    artistName: 'Queen',
    albumName: 'A Night at the Opera',
    albumCoverUrl: placeholderAlbumArt,
    votes: 15
  },
  {
    songTitle: 'Hotel California',
    artistName: 'Eagles',
    albumName: 'Hotel California',
    albumCoverUrl: placeholderAlbumArt,
    votes: 12
  },
  {
    songTitle: 'Stairway to Heaven',
    artistName: 'Led Zeppelin',
    albumName: 'Led Zeppelin IV',
    albumCoverUrl: placeholderAlbumArt,
    votes: 10
  },
  {
    songTitle: 'Bohemian Rhapsody',
    artistName: 'Queen',
    albumName: 'A Night at the Opera',
    albumCoverUrl: placeholderAlbumArt,
    votes: 15
  },
  {
    songTitle: 'Hotel California',
    artistName: 'Eagles',
    albumName: 'Hotel California',
    albumCoverUrl: placeholderAlbumArt,
    votes: 12
  },
  {
    songTitle: 'Stairway to Heaven',
    artistName: 'Led Zeppelin',
    albumName: 'Led Zeppelin IV',
    albumCoverUrl: placeholderAlbumArt,
    votes: 10
  }
];

const mockAlbums: RecommendedAlbum[] = [
  {
    albumTitle: 'Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 18
  },
  {
    albumTitle: 'Thriller',
    artistName: 'Michael Jackson',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 9,
    votes: 14
  },
  {
    albumTitle: 'Abbey Road',
    artistName: 'The Beatles',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 17,
    votes: 11
  },
  {
    albumTitle: 'The Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11
  },
  {
    albumTitle: 'The Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11
  },
  {
    albumTitle: 'The Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11
  },
];

const mockArtists: RecommendedArtist[] = [
  {
    artistName: 'David Bowie',
    artistImageUrl: placeholderAlbumArt,
    genres: ['Rock', 'Art Rock', 'Glam Rock'],
    votes: 20
  },
  {
    artistName: 'Prince',
    artistImageUrl: placeholderAlbumArt,
    genres: ['Pop', 'Funk', 'R&B'],
    votes: 16
  },
  {
    artistName: 'Fleetwood Mac',
    artistImageUrl: placeholderAlbumArt,
    genres: ['Rock', 'Pop Rock'],
    votes: 13
  },
  {
    artistName: 'The Beatles',
    artistImageUrl: placeholderAlbumArt,
    genres: ['Rock', 'Pop Rock'],
    votes: 13
  },
  {
    artistName: 'The Beatles',
    artistImageUrl: placeholderAlbumArt,
    genres: ['Rock', 'Pop Rock'],
    votes: 13
  },
  {
    artistName: 'The Beatles',
    artistImageUrl: placeholderAlbumArt,
    genres: ['Rock', 'Pop Rock'],
    votes: 13
  },
];

const initialState: RecommendationsState = {
  songs: { items: [], loading: false, error: null, loaded: false },
  albums: { items: [], loading: false, error: null, loaded: false },
  artists: { items: [], loading: false, error: null, loaded: false },
};

// Create the context
const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

// Reducer function
function recommendationsReducer(state: RecommendationsState, action: RecommendationsAction): RecommendationsState {
  switch (action.type) {
    case 'FETCH_RECOMMENDATIONS_REQUEST':
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          loading: true,
          error: null
        }
      };
    case 'FETCH_RECOMMENDATIONS_SUCCESS':
      return {
        ...state,
        [action.recommendationType]: {
          items: action.items,
          loading: false,
          error: null,
          loaded: true
        }
      };
    case 'FETCH_RECOMMENDATIONS_FAILURE':
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          loading: false,
          error: action.error,
          loaded: true
        }
      };
    case 'ADD_RECOMMENDATION':
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items: [
            { ...action.item, votes: 1 }, // Initialize new recommendations with 1 vote
            ...state[action.recommendationType].items
          ]
        }
      };
    case 'UPVOTE_RECOMMENDATION': {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];

      // Update vote count
      items[action.index] = {
        ...item,
        votes: (item.votes || 0) + 1
      };

      // Sort by votes
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items
        }
      };
    }
    default:
      return state;
  }
}

// Provider component
export const RecommendationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(recommendationsReducer, initialState);

  // Memoize callback functions so they don't change on every render
  const fetchRecommendations = useCallback((type: 'songs' | 'albums' | 'artists') => {
    // Simulate a loading state briefly for UI testing
    dispatch({ type: 'FETCH_RECOMMENDATIONS_REQUEST', recommendationType: type });

    // Select the appropriate mock data based on type
    const mockData = type === 'songs' ? mockSongs :
      type === 'albums' ? mockAlbums : mockArtists;

    // Simulate success with a delay to see the loader
    setTimeout(() => {
      dispatch({
        type: 'FETCH_RECOMMENDATIONS_SUCCESS',
        recommendationType: type,
        items: mockData
      });
    }, 2000);
  }, []); // Empty dependency array since this doesn't depend on any props or state

  const addRecommendation = useCallback((type: 'songs' | 'albums' | 'artists', item: RecommendedSong | RecommendedAlbum | RecommendedArtist) => {
    dispatch({
      type: 'ADD_RECOMMENDATION',
      recommendationType: type,
      item
    });
  }, []);

  const upvoteRecommendation = useCallback((type: 'songs' | 'albums' | 'artists', index: number) => {
    dispatch({
      type: 'UPVOTE_RECOMMENDATION',
      recommendationType: type,
      index
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    fetchRecommendations,
    addRecommendation,
    upvoteRecommendation
  }), [state, fetchRecommendations, addRecommendation, upvoteRecommendation]);

  return (
    <RecommendationsContext.Provider value={contextValue}>
      {children}
    </RecommendationsContext.Provider>
  );
};

// Custom hook for using the context
export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
}; 