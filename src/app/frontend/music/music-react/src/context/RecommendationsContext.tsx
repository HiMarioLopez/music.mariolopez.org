import { createContext, useContext } from "react";
import {
  RecommendedSong,
  RecommendedAlbum,
  RecommendedArtist,
} from "../types/Recommendations";

export type RecommendationsState = {
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

export type RecommendationsContextType = {
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

export const RecommendationsContext = createContext<
  RecommendationsContextType | undefined
>(undefined);

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error(
      "useRecommendations must be used within a RecommendationsProvider",
    );
  }
  return context;
};
