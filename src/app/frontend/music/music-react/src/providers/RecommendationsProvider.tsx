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
    wasUpdated?: boolean;
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
        
      // First, check if this item already exists in our state
      // We'll compare based on key fields depending on the type
      let existingItemIndex = -1;
      let existingItemId: string | undefined;
      
      if (type === "songs") {
        const songItem = item as RecommendedSong;
        existingItemIndex = state[type].items.findIndex(
          (existingItem) => 
            (existingItem as RecommendedSong).songTitle === songItem.songTitle &&
            (existingItem as RecommendedSong).artistName === songItem.artistName
        );
      } else if (type === "albums") {
        const albumItem = item as RecommendedAlbum;
        existingItemIndex = state[type].items.findIndex(
          (existingItem) => 
            (existingItem as RecommendedAlbum).albumTitle === albumItem.albumTitle &&
            (existingItem as RecommendedAlbum).artistName === albumItem.artistName
        );
      } else if (type === "artists") {
        const artistItem = item as RecommendedArtist;
        existingItemIndex = state[type].items.findIndex(
          (existingItem) => 
            (existingItem as RecommendedArtist).artistName === artistItem.artistName
        );
      }
      
      if (existingItemIndex !== -1) {
        existingItemId = state[type].items[existingItemIndex].id;
      }

      // Extract data from the item based on type
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

      // Create the recommendation using the API
      apiService
        .createRecommendation(entityType, apiData)
        .then((response: CreateRecommendationResponse) => {
          // Check if we already had this item in our state
          if (existingItemIndex !== -1 && existingItemId) {
            // If we found a matching item in our state, update it
            const updatedItem = {
              ...state[type].items[existingItemIndex],
              ...item, // Merge in any new properties
              id: existingItemId, // Preserve the existing ID
              // For simplicity, we'll leave the votes unchanged
            };
            
            dispatch({
              type: "UPDATE_RECOMMENDATION",
              recommendationType: type,
              item: updatedItem as any,
              id: existingItemId,
            });
          } else if (response.recommendation.wasUpdated === true && response.recommendation.id) {
            // This is a fallback for when the backend indicates it was updated
            // but we didn't find a match in our state (perhaps it was added in another session)
            console.log("Backend reports update, but no matching item found in local state.", response.recommendation);
            
            // Try to find the item by the ID returned from the backend
            const itemIndex = state[type].items.findIndex(
              (existingItem) => existingItem.id === response.recommendation.id
            );
            
            if (itemIndex !== -1) {
              // If we find it by ID, update it
              const updatedItem = {
                ...state[type].items[itemIndex],
                ...item,
                id: response.recommendation.id,
              };
              
              dispatch({
                type: "UPDATE_RECOMMENDATION",
                recommendationType: type,
                item: updatedItem as any,
                id: response.recommendation.id,
              });
            } else {
              // If we still can't find it, add it as new (unusual case)
              const newItem = {
                ...item,
                id: response.recommendation.id,
                votes: 1, // New recommendations start with 1 vote
              };

              dispatch({
                type: "ADD_RECOMMENDATION",
                recommendationType: type,
                item: newItem as any,
              });
            }
          } else {
            // Add the recommendation to the state as a new item
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
          }
        })
        .catch((error) => {
          console.error("Failed to create recommendation:", error);
          // We could also dispatch an error action here if you want to show error messages
        });
    },
    [state, dispatch],
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
