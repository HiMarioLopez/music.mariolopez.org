export type NoteItem = {
  from: string;
  note: string;
  noteTimestamp: string;
};

export type RecommendedSong = {
  id?: string;
  songTitle: string;
  artistName: string;
  albumName: string;
  albumCoverUrl: string;
  votes?: number;
  userVoted?: "up" | "down";
  notes?: NoteItem[];
};

export type RecommendedAlbum = {
  id?: string;
  albumTitle: string;
  artistName: string;
  albumCoverUrl: string;
  trackCount?: number;
  releaseDate?: string;
  votes?: number;
  userVoted?: "up" | "down";
  notes?: NoteItem[];
};

export type RecommendedArtist = {
  id?: string;
  artistName: string;
  artistImageUrl: string;
  genres?: string[];
  votes?: number;
  userVoted?: "up" | "down";
  notes?: NoteItem[];
};
