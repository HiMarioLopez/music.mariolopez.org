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
import { apiService } from "../services/apiService";

// Define response types for the API
interface PaginatedRecommendationsResponse {
  items: Array<{
    entityType: string;
    timestamp: string;
    id?: string;
    votes?: number;
    [key: string]: any;
  }>;
  pagination: {
    count: number;
    hasMore: boolean;
    nextToken?: string;
  };
}

interface CreateRecommendationResponse {
  message: string;
  recommendation: {
    entityType: string;
    timestamp: string;
    id?: string;
    votes?: number;
    [key: string]: any;
  };
}

const initialState: RecommendationsState = {
  songs: { items: [], loading: false, error: null, loaded: false },
  albums: { items: [], loading: false, error: null, loaded: false },
  artists: { items: [], loading: false, error: null, loaded: false },
};

export const RecommendationsProvider: React.FC<{
  children: ReactNode;
  useMockData?: boolean;
}> = ({ children, useMockData = false }) => {
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
        // Map frontend type to backend entityType
        const entityType =
          type === "songs" ? "SONG" : type === "albums" ? "ALBUM" : "ARTIST";

        // Call the real API
        apiService
          .getRecommendations(entityType)
          .then((response: PaginatedRecommendationsResponse) => {
            // Extract items from the pagination response and filter by entity type
            let items:
              | RecommendedSong[]
              | RecommendedAlbum[]
              | RecommendedArtist[] = [];

            // Filter and convert items based on the recommendation type
            if (type === "songs") {
              items = response.items
                .filter((item) => item.entityType === "SONG")
                .map(
                  (item) =>
                    ({
                      id: item.id || `SONG_${item.timestamp}`,
                      songTitle: item.songTitle,
                      artistName: item.artistName,
                      albumName: item.albumName,
                      albumCoverUrl: item.albumCoverUrl || "",
                      votes: item.votes || 0,
                      from: item.from,
                      note: item.note,
                    }) as RecommendedSong,
                );
            } else if (type === "albums") {
              items = response.items
                .filter((item) => item.entityType === "ALBUM")
                .map(
                  (item) =>
                    ({
                      id: item.id || `ALBUM_${item.timestamp}`,
                      albumTitle: item.albumTitle,
                      artistName: item.artistName,
                      albumCoverUrl: item.albumCoverUrl || "",
                      trackCount: item.trackCount,
                      releaseDate: item.releaseDate,
                      votes: item.votes || 0,
                      from: item.from,
                      note: item.note,
                    }) as RecommendedAlbum,
                );
            } else {
              items = response.items
                .filter((item) => item.entityType === "ARTIST")
                .map(
                  (item) =>
                    ({
                      id: item.id || `ARTIST_${item.timestamp}`,
                      artistName: item.artistName,
                      artistImageUrl: item.artistImageUrl || "",
                      genres: item.genres,
                      votes: item.votes || 0,
                      from: item.from,
                      note: item.note,
                    }) as RecommendedArtist,
                );
            }

            dispatch({
              type: "FETCH_RECOMMENDATIONS_SUCCESS",
              recommendationType: type,
              items,
            });
          })
          .catch((error) => {
            dispatch({
              type: "FETCH_RECOMMENDATIONS_FAILURE",
              recommendationType: type,
              error: error.message || "Failed to fetch recommendations",
            });
          });
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
      // Map frontend recommendation type to backend entityType
      const entityType =
        type === "songs" ? "SONG" : type === "albums" ? "ALBUM" : "ARTIST";

      // Extract data from the item based on type
      let apiData: Record<string, any> = {};

      if (type === "songs") {
        const songItem = item as RecommendedSong;
        apiData = {
          songTitle: songItem.songTitle,
          artistName: songItem.artistName,
          albumName: songItem.albumName,
          albumCoverUrl: songItem.albumCoverUrl,
          from: songItem.from,
          note: songItem.note,
        };
      } else if (type === "albums") {
        const albumItem = item as RecommendedAlbum;
        apiData = {
          albumTitle: albumItem.albumTitle,
          artistName: albumItem.artistName,
          albumCoverUrl: albumItem.albumCoverUrl,
          trackCount: albumItem.trackCount,
          releaseDate: albumItem.releaseDate,
          from: albumItem.from,
          note: albumItem.note,
        };
      } else {
        const artistItem = item as RecommendedArtist;
        apiData = {
          artistName: artistItem.artistName,
          artistImageUrl: artistItem.artistImageUrl,
          genres: artistItem.genres,
          from: artistItem.from,
          note: artistItem.note,
        };
      }

      // Create the recommendation using the API
      apiService
        .createRecommendation(entityType, apiData)
        .then((response: CreateRecommendationResponse) => {
          // Add the recommendation to the state
          const newItem = {
            ...item,
            id:
              response.recommendation.id ||
              `${entityType}_${response.recommendation.timestamp}`,
            votes: 1, // New recommendations start with 1 vote
          };

          dispatch({
            type: "ADD_RECOMMENDATION",
            recommendationType: type,
            item: newItem as any,
          });
        })
        .catch((error) => {
          console.error("Failed to create recommendation:", error);
          // We could also dispatch an error action here if you want to show error messages
        });
    },
    [],
  );

  const upvoteRecommendation = useCallback(
    (type: "songs" | "albums" | "artists", index: number) => {
      // TODO: Add API call to update votes on the backend
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
      // TODO: Add API call to update votes on the backend
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
      // TODO: Add API call to update votes on the backend
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
