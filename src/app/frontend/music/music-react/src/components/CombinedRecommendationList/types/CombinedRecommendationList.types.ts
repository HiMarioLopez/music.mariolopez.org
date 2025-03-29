import {
  RecommendedAlbum,
  RecommendedArtist,
  RecommendedSong,
} from "../../../types/Recommendations";

export type RecommendationType = "songs" | "albums" | "artists";

export type Note = {
  from: string;
  note: string;
  noteTimestamp: string;
};

export type RecommendationStateMap = {
  songs: {
    recommendations: RecommendedSong[];
    votedItems: Record<string, boolean>;
    downvotedItems: Record<string, boolean>;
    setVotedItems: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
    setDownvotedItems: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
    component: React.FC<any>;
  };
  albums: {
    recommendations: RecommendedAlbum[];
    votedItems: Record<string, boolean>;
    downvotedItems: Record<string, boolean>;
    setVotedItems: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
    setDownvotedItems: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
    component: React.FC<any>;
  };
  artists: {
    recommendations: RecommendedArtist[];
    votedItems: Record<string, boolean>;
    downvotedItems: Record<string, boolean>;
    setVotedItems: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
    setDownvotedItems: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
    component: React.FC<any>;
  };
};
