import { RecommendedAlbum, RecommendedArtist, RecommendedSong } from "../../types/Recommendations";

export type RecommendationType = 'songs' | 'albums' | 'artists';

export type RecommendationStateMap = {
  songs: {
    recommendations: RecommendedSong[];
    setRecommendations: React.Dispatch<React.SetStateAction<RecommendedSong[]>>;
    votedItems: Record<number, boolean>;
    setVotedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    component: React.FC<any>;
  };
  albums: {
    recommendations: RecommendedAlbum[];
    setRecommendations: React.Dispatch<React.SetStateAction<RecommendedAlbum[]>>;
    votedItems: Record<number, boolean>;
    setVotedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    component: React.FC<any>;
  };
  artists: {
    recommendations: RecommendedArtist[];
    setRecommendations: React.Dispatch<React.SetStateAction<RecommendedArtist[]>>;
    votedItems: Record<number, boolean>;
    setVotedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    component: React.FC<any>;
  };
};