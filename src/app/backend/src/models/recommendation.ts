export interface BaseRecommendation {
  recommendationId: string; // UUID
  entityType: EntityType; // Type of entity ('SONG', 'ALBUM', 'ARTIST')
  createdAt: string; // ISO timestamp
  votes: number;
  reviewedByUser: boolean; // Whether the recommendation has been reviewed by Mario
  userInteractionStatus?: UserInteractionStatus; // Whether the Mario has interacted with the recommendation
}

export interface SongRecommendation extends BaseRecommendation {
  entityType: 'SONG';
  songTitle: string;
  artistName: string;
  albumName: string;
  albumCoverUrl?: string;
}

export interface AlbumRecommendation extends BaseRecommendation {
  entityType: 'ALBUM';
  albumTitle: string;
  artistName: string;
  albumCoverUrl?: string;
  trackCount?: number;
  releaseDate?: string;
}

export interface ArtistRecommendation extends BaseRecommendation {
  entityType: 'ARTIST';
  artistName: string;
  artistImageUrl?: string;
  genres?: string[];
}

export type EntityType = 'SONG' | 'ALBUM' | 'ARTIST';

export type UserInteractionStatus =
  | 'LIKED' // Mario explicitly liked it
  | 'DISLIKED' // Mario explicitly disliked it
  | 'DISMISSED'; // Mario dismissed or declined the recommendation

export type Recommendation =
  | SongRecommendation
  | AlbumRecommendation
  | ArtistRecommendation;
