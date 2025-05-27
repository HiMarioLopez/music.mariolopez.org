import React, { ReactNode, useReducer, useCallback, useMemo } from "react";
import {
  RecommendedSong,
  RecommendedAlbum,
  RecommendedArtist,
} from "../types/Recommendations";
import {
  RecommendationsContext,
  RecommendationsState,
} from "../context/RecommendationsContext";
import { recommendationsReducer } from "../reducers/RecommendationsReducer";
import { apiService } from "../services/apiService";

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

const initialState: RecommendationsState = {
  songs: { items: [], loading: false, error: null, loaded: false },
  albums: { items: [], loading: false, error: null, loaded: false },
  artists: { items: [], loading: false, error: null, loaded: false },
};

export const RecommendationsProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [state, dispatch] = useReducer(recommendationsReducer, initialState);

  // Memoize callback functions so they don't change on every render
  const fetchRecommendations = useCallback(
    (type: "songs" | "albums" | "artists", consistent = false) => {
      dispatch({
        type: "FETCH_RECOMMENDATIONS_REQUEST",
        recommendationType: type,
      });

      // Map frontend type to backend entityType
      const entityType =
        type === "songs" ? "SONG" : type === "albums" ? "ALBUM" : "ARTIST";

      // Call the real API
      apiService
        .getRecommendations(
          entityType,
          undefined,
          undefined,
          undefined,
          consistent,
        )
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
              .map((item) => {
                // Extract notes array or create empty array if not present
                const notes = Array.isArray(item.notes) ? item.notes : [];

                return {
                  id: item.id || `SONG_${item.timestamp}`,
                  songTitle: item.songTitle,
                  artistName: item.artistName,
                  albumName: item.albumName,
                  albumCoverUrl: item.albumCoverUrl || "",
                  votes: item.votes || 0,
                  notes: notes,
                } as RecommendedSong;
              });
          } else if (type === "albums") {
            items = response.items
              .filter((item) => item.entityType === "ALBUM")
              .map((item) => {
                // Extract notes array or create empty array if not present
                const notes = Array.isArray(item.notes) ? item.notes : [];

                return {
                  id: item.id || `ALBUM_${item.timestamp}`,
                  albumTitle: item.albumTitle,
                  artistName: item.artistName,
                  albumCoverUrl: item.albumCoverUrl || "",
                  trackCount: item.trackCount,
                  releaseDate: item.releaseDate,
                  votes: item.votes || 0,
                  notes: notes,
                } as RecommendedAlbum;
              });
          } else {
            items = response.items
              .filter((item) => item.entityType === "ARTIST")
              .map((item) => {
                // Extract notes array or create empty array if not present
                const notes = Array.isArray(item.notes) ? item.notes : [];

                return {
                  id: item.id || `ARTIST_${item.timestamp}`,
                  artistName: item.artistName,
                  artistImageUrl: item.artistImageUrl || "",
                  genres: item.genres,
                  votes: item.votes || 0,
                  notes: notes,
                } as RecommendedArtist;
              });
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
    },
    [],
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

      // Build API payload based on type
      let apiData: Record<string, any> = {};
      if (type === "songs") {
        const songItem = item as RecommendedSong;
        apiData = {
          songTitle: songItem.songTitle,
          artistName: songItem.artistName,
          albumName: songItem.albumName,
          albumCoverUrl: songItem.albumCoverUrl,
          notes: songItem.notes,
        };
      } else if (type === "albums") {
        const albumItem = item as RecommendedAlbum;
        apiData = {
          albumTitle: albumItem.albumTitle,
          artistName: albumItem.artistName,
          albumCoverUrl: albumItem.albumCoverUrl,
          trackCount: albumItem.trackCount,
          releaseDate: albumItem.releaseDate,
          notes: albumItem.notes,
        };
      } else {
        const artistItem = item as RecommendedArtist;
        apiData = {
          artistName: artistItem.artistName,
          artistImageUrl: artistItem.artistImageUrl,
          genres: artistItem.genres,
          notes: artistItem.notes,
        };
      }

      // Create the recommendation and refetch on success
      apiService.createRecommendation(entityType, apiData).catch((error) => {
        console.error("Failed to create recommendation:", error);
      });
    },
    [fetchRecommendations],
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
