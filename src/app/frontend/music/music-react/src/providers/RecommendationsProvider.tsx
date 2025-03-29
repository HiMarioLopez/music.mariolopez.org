import React, { ReactNode, useReducer, useCallback, useMemo } from "react";
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
import {
  RecommendationsContext,
  RecommendationsState,
} from "../context/RecommendationsContext";
import { recommendationsReducer } from "../reducers/RecommendationsReducer";

const initialState: RecommendationsState = {
  songs: { items: [], loading: false, error: null, loaded: false },
  albums: { items: [], loading: false, error: null, loaded: false },
  artists: { items: [], loading: false, error: null, loaded: false },
};

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
