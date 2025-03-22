import { RecommendedAlbum, RecommendedArtist, RecommendedSong } from "../../types/Recommendations";

export type RecommendationType = 'songs' | 'albums' | 'artists';

export type RecommendationStateMap = {
  songs: {
    recommendations: RecommendedSong[];
    votedItems: Record<number, boolean>;
    setVotedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    component: React.FC<any>;
  };
  albums: {
    recommendations: RecommendedAlbum[];
    votedItems: Record<number, boolean>;
    setVotedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    component: React.FC<any>;
  };
  artists: {
    recommendations: RecommendedArtist[];
    votedItems: Record<number, boolean>;
    setVotedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    component: React.FC<any>;
  };
};