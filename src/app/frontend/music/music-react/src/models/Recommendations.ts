export type Recommendation = {
  recommendationId: string;
  entityType: EntityType;
  createdAt: string;
  votes: number;
  reviewedByUser: boolean;
  userInteractionStatus?: UserInteractionStatus;
};

export type SongRecommendation = Recommendation & {
  entityType: "SONG";
  songTitle: string;
  artistName: string;
  albumName: string;
  albumCoverUrl?: string;
};

export type AlbumRecommendation = Recommendation & {
  entityType: "ALBUM";
  albumTitle: string;
  artistName: string;
  albumCoverUrl?: string;
  trackCount?: number;
  releaseDate?: string;
};

export type ArtistRecommendation = Recommendation & {
  entityType: "ARTIST";
  artistName: string;
  artistImageUrl?: string;
  genres?: string[];
};

export type EntityType = "SONG" | "ALBUM" | "ARTIST";

export type UserInteractionStatus = "LIKED" | "DISLIKED" | "DISMISSED";

export interface PaginatedRecommendationsResponse {
  items: Array<{
    recommendationId?: string;
    entityType: string;
    createdAt: string;
    votes?: number;
    [key: string]: any;
  }>;
  pagination: {
    count: number;
    hasMore: boolean;
    nextToken?: string;
  };
}

export interface CreateRecommendationResponse {
  message: string;
  recommendation: {
    recommendationId?: string;
    entityType: string;
    createdAt: string;
    votes?: number;
    wasUpdated?: boolean;
    [key: string]: any;
  };
}
