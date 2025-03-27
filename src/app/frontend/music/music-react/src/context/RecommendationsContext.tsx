import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import {
  RecommendedSong,
  RecommendedAlbum,
  RecommendedArtist,
} from "../types/Recommendations";
import {
  mockSongs,
  mockAlbums,
  mockArtists,
} from "../mocks/data/mockRecommendationsData";

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

// Improve type safety for action creators with generics
type FetchSuccessAction<T extends "songs" | "albums" | "artists"> = {
  type: "FETCH_RECOMMENDATIONS_SUCCESS";
  recommendationType: T;
  items: T extends "songs"
    ? RecommendedSong[]
    : T extends "albums"
      ? RecommendedAlbum[]
      : RecommendedArtist[];
};

type RecommendationsAction =
  | {
      type: "FETCH_RECOMMENDATIONS_REQUEST";
      recommendationType: "songs" | "albums" | "artists";
    }
  | FetchSuccessAction<"songs" | "albums" | "artists">
  | {
      type: "FETCH_RECOMMENDATIONS_FAILURE";
      recommendationType: "songs" | "albums" | "artists";
      error: string;
    }
  | {
      type: "ADD_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      item: RecommendedSong | RecommendedAlbum | RecommendedArtist;
    }
  | {
      type: "UPVOTE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      index: number;
    }
  | {
      type: "DOWNVOTE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      index: number;
    }
  | {
      type: "REALTIME_UPDATE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      index: number;
      voteIncrement: number;
    };

type RecommendationsContextType = {
  state: RecommendationsState;
  fetchRecommendations: (type: "songs" | "albums" | "artists") => void;
  addRecommendation: (
    type: "songs" | "albums" | "artists",
    item: RecommendedSong | RecommendedAlbum | RecommendedArtist,
  ) => void;
  upvoteRecommendation: (
    type: "songs" | "albums" | "artists",
    index: number,
  ) => void;
  downvoteRecommendation: (
    type: "songs" | "albums" | "artists",
    index: number,
  ) => void;
  updateRecommendationInRealTime: (
    type: "songs" | "albums" | "artists",
    index: number,
    voteIncrement: number,
  ) => void;
  isLoading: (type: "songs" | "albums" | "artists") => boolean;
  getError: (type: "songs" | "albums" | "artists") => string | null;
};

const initialState: RecommendationsState = {
  songs: { items: [], loading: false, error: null, loaded: false },
  albums: { items: [], loading: false, error: null, loaded: false },
  artists: { items: [], loading: false, error: null, loaded: false },
};

const RecommendationsContext = createContext<
  RecommendationsContextType | undefined
>(undefined);

// Helper to generate a unique ID
const generateId = () => `id_${Math.random().toString(36).substring(2, 9)}`;

// Helper to ensure each item has an ID
function ensureIds<T>(items: T[]): (T & { id: string })[] {
  return items.map((item) => {
    if (typeof item === "object" && item !== null && !("id" in item)) {
      return { ...(item as object), id: generateId() } as T & { id: string };
    }
    return item as T & { id: string };
  });
}

function recommendationsReducer(
  state: RecommendationsState,
  action: RecommendationsAction,
): RecommendationsState {
  switch (action.type) {
    case "FETCH_RECOMMENDATIONS_REQUEST":
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          loading: true,
          error: null,
        },
      };
    case "FETCH_RECOMMENDATIONS_SUCCESS": {
      let typedItems;
      if (action.recommendationType === "songs") {
        typedItems = ensureIds(action.items as RecommendedSong[]);
      } else if (action.recommendationType === "albums") {
        typedItems = ensureIds(action.items as RecommendedAlbum[]);
      } else {
        typedItems = ensureIds(action.items as RecommendedArtist[]);
      }

      return {
        ...state,
        [action.recommendationType]: {
          items: typedItems,
          loading: false,
          error: null,
          loaded: true,
        },
      };
    }
    case "FETCH_RECOMMENDATIONS_FAILURE":
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          loading: false,
          error: action.error,
          loaded: true,
        },
      };
    case "ADD_RECOMMENDATION":
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items: [
            { ...action.item, votes: 1, id: generateId() }, // Initialize new recommendations with 1 vote and an ID
            ...state[action.recommendationType].items,
          ],
        },
      };
    case "UPVOTE_RECOMMENDATION": {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];
      let newVotes = item.votes || 0;

      // If already upvoted, remove the upvote (reset)
      if (
        state[action.recommendationType].items[action.index].userVoted === "up"
      ) {
        items[action.index] = {
          ...item,
          votes: Math.max(0, newVotes - 1),
          userVoted: undefined,
        };

        // Sort items by votes
        items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        return {
          ...state,
          [action.recommendationType]: {
            ...state[action.recommendationType],
            items,
          },
        };
      }

      // If previously downvoted, add 2 (remove the downvote and add an upvote)
      if (
        state[action.recommendationType].items[action.index].userVoted ===
        "down"
      ) {
        newVotes += 2;
      } else {
        // Otherwise just add 1
        newVotes += 1;
      }

      // Update vote count and userVoted status
      items[action.index] = {
        ...item,
        votes: newVotes,
        userVoted: "up",
      };

      // Sort items by votes
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    case "DOWNVOTE_RECOMMENDATION": {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];
      let newVotes = item.votes || 0;

      // If already downvoted, remove the downvote (reset)
      if (
        state[action.recommendationType].items[action.index].userVoted ===
        "down"
      ) {
        items[action.index] = {
          ...item,
          votes: (item.votes || 0) + 1, // Always add 1 when removing a downvote
          userVoted: undefined,
        };

        // Sort items by votes
        items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        return {
          ...state,
          [action.recommendationType]: {
            ...state[action.recommendationType],
            items,
          },
        };
      }

      // If previously upvoted, subtract 2 (remove the upvote and add a downvote)
      if (
        state[action.recommendationType].items[action.index].userVoted === "up"
      ) {
        newVotes -= 2;
      } else {
        // Otherwise just subtract 1
        newVotes -= 1;
      }

      // Ensure votes don't go below 0
      newVotes = Math.max(0, newVotes);

      // Update vote count and userVoted status
      items[action.index] = {
        ...item,
        votes: newVotes,
        userVoted: "down",
      };

      // Sort items by votes
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    case "REALTIME_UPDATE_RECOMMENDATION": {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];
      const newVotes = (item.votes || 0) + action.voteIncrement;

      // Update vote count
      items[action.index] = {
        ...item,
        votes: newVotes,
      };

      // Sort items by votes after real-time update
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    default:
      return state;
  }
}

export const RecommendationsProvider: React.FC<{
  children: ReactNode;
  useMockData?: boolean;
}> = ({ children, useMockData = true }) => {
  const [state, dispatch] = useReducer(recommendationsReducer, initialState);

  // Memoize callback functions so they don't change on every render
  const fetchRecommendations = useCallback(
    (type: "songs" | "albums" | "artists") => {
      dispatch({
        type: "FETCH_RECOMMENDATIONS_REQUEST",
        recommendationType: type,
      });

      if (useMockData) {
        // Mock data implementation
        const mockData =
          type === "songs"
            ? mockSongs
            : type === "albums"
              ? mockAlbums
              : mockArtists;

        setTimeout(() => {
          dispatch({
            type: "FETCH_RECOMMENDATIONS_SUCCESS",
            recommendationType: type,
            items: mockData,
          });
        }, 750);
      } else {
        // Real API implementation (to be added later)
        // Example:
        // api.getRecommendations(type)
        //   .then(data => dispatch({
        //     type: 'FETCH_RECOMMENDATIONS_SUCCESS',
        //     recommendationType: type,
        //     items: data
        //   }))
        //   .catch(error => dispatch({
        //     type: 'FETCH_RECOMMENDATIONS_FAILURE',
        //     recommendationType: type,
        //     error: error.message
        //   }));
      }
    },
    [useMockData],
  );

  const addRecommendation = useCallback(
    <T extends "songs" | "albums" | "artists">(
      type: T,
      item: T extends "songs"
        ? RecommendedSong
        : T extends "albums"
          ? RecommendedAlbum
          : RecommendedArtist,
    ) => {
      dispatch({
        type: "ADD_RECOMMENDATION",
        recommendationType: type,
        item: item as any, // Cast needed due to TypeScript limitations, but our runtime logic is correct
      });
    },
    [],
  );

  const upvoteRecommendation = useCallback(
    (type: "songs" | "albums" | "artists", index: number) => {
      dispatch({
        type: "UPVOTE_RECOMMENDATION",
        recommendationType: type,
        index,
      });
    },
    [],
  );

  const downvoteRecommendation = useCallback(
    (type: "songs" | "albums" | "artists", index: number) => {
      dispatch({
        type: "DOWNVOTE_RECOMMENDATION",
        recommendationType: type,
        index,
      });
    },
    [],
  );

  const updateRecommendationInRealTime = useCallback(
    (
      type: "songs" | "albums" | "artists",
      index: number,
      voteIncrement: number,
    ) => {
      dispatch({
        type: "REALTIME_UPDATE_RECOMMENDATION",
        recommendationType: type,
        index,
        voteIncrement,
      });
    },
    [],
  );

  const isLoading = useCallback(
    (type: "songs" | "albums" | "artists") => {
      return state[type].loading;
    },
    [state],
  );

  const getError = useCallback(
    (type: "songs" | "albums" | "artists") => {
      return state[type].error;
    },
    [state],
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      fetchRecommendations,
      addRecommendation,
      upvoteRecommendation,
      downvoteRecommendation,
      updateRecommendationInRealTime,
      isLoading,
      getError,
    }),
    [
      state,
      fetchRecommendations,
      addRecommendation,
      upvoteRecommendation,
      downvoteRecommendation,
      updateRecommendationInRealTime,
      isLoading,
      getError,
    ],
  );

  return (
    <RecommendationsContext.Provider value={contextValue}>
      {children}
    </RecommendationsContext.Provider>
  );
};

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error(
      "useRecommendations must be used within a RecommendationsProvider",
    );
  }
  return context;
};
