// Apple Music Song API response
export interface AppleMusicSong {
  processedTimestamp: string;
  isrc: string;
  durationInMillis: number;
  composerName: string;
  songId: string;
  url: string;
  genreNames: string[];
  name: string;
  hasLyrics: boolean;
  trackNumber: number;
  releaseDate: string;
  artworkColors: {
    textColor1: string;
    backgroundColor: string;
    textColor4: string;
    textColor2: string;
    textColor3: string;
  };
  albumName: string;
  isAppleDigitalMaster: boolean;
  id: string;
  artworkUrl: string;
  artistName: string;
}
