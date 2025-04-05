export interface BaseRecommendation {
  recommendationId: string; // UUID or composite key string
  entityType: EntityType; // Type of entity (song, album, artist)
  createdAt: string; // ISO timestamp
  votes: number;
  reviewedByMario: boolean; // Whether the recommendation has been reviewed by Mario
  userStatus?: UserInteractionStatus; // Whether the Mario has interacted with the recommendation
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

export type EntityType =
  | 'SONG'
  | 'ALBUM'
  | 'ARTIST';

export type UserInteractionStatus =
  | 'liked' // Mario explicitly liked it
  | 'disliked' // Mario explicitly disliked it
  | 'dismissed'; // Mario dismissed or declined the recommendation

export type Recommendation =
  | SongRecommendation
  | AlbumRecommendation
  | ArtistRecommendation;
