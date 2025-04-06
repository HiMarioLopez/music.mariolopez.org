import {
  RecommendedSong,
  RecommendedAlbum,
  RecommendedArtist,
} from "../../types/Recommendations";
import placeholderAlbumArt from "../../assets/50.png";

// Mock song recommendations data
export const mockSongs: RecommendedSong[] = [
  {
    id: "song_1",
    songTitle: "Bohemian Rhapsody 2",
    artistName: "Queen",
    albumName: "A Night at the Opera",
    albumCoverUrl: placeholderAlbumArt,
    votes: 19,
  },
  {
    id: "song_2",
    songTitle: "Bohemian Rhapsody",
    artistName: "Queen",
    albumName: "A Night at the Opera",
    albumCoverUrl: placeholderAlbumArt,
    votes: 15,
  },
  {
    id: "song_3",
    songTitle: "Hotel California",
    artistName: "Eagles",
    albumName: "Hotel California",
    albumCoverUrl: placeholderAlbumArt,
    votes: 13,
  },
  {
    id: "song_4",
    songTitle: "Hotel California 2",
    artistName: "Eagles",
    albumName: "Hotel California",
    albumCoverUrl: placeholderAlbumArt,
    votes: 12,
  },
  {
    id: "song_5",
    songTitle: "Stairway to Heaven 2",
    artistName: "Led Zeppelin",
    albumName: "Led Zeppelin IV",
    albumCoverUrl: placeholderAlbumArt,
    votes: 10,
  },
  {
    id: "song_6",
    songTitle: "Stairway to Heaven",
    artistName: "Led Zeppelin",
    albumName: "Led Zeppelin IV",
    albumCoverUrl: placeholderAlbumArt,
    votes: 10,
  },
];

// Mock album recommendations data
export const mockAlbums: RecommendedAlbum[] = [
  {
    id: "album_1",
    albumTitle: "Dark Side of the Moon",
    artistName: "Pink Floyd",
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 18,
  },
  {
    id: "album_2",
    albumTitle: "Thriller",
    artistName: "Michael Jackson",
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 9,
    votes: 14,
  },
  {
    id: "album_3",
    albumTitle: "Abbey Road",
    artistName: "The Beatles",
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 17,
    votes: 11,
  },
  {
    id: "album_4",
    albumTitle: "The Dark Side of the Moon 2",
    artistName: "Pink Floyd",
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11,
  },
  {
    id: "album_5",
    albumTitle: "The Dark Side of the Moon 3",
    artistName: "Pink Floyd",
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11,
  },
  {
    id: "album_6",
    albumTitle: "The Dark Side of the Moon 4",
    artistName: "Pink Floyd",
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 9,
  },
];

// Mock artist recommendations data
export const mockArtists: RecommendedArtist[] = [
  // {
  //   artistName: 'David Bowie',
  //   artistImageUrl: placeholderAlbumArt,
  //   genres: ['Rock', 'Art Rock', 'Glam Rock'],
  //   votes: 20
  // },
  // {
  //   artistName: 'Prince',
  //   artistImageUrl: placeholderAlbumArt,
  //   genres: ['Pop', 'Funk', 'R&B'],
  //   votes: 16
  // },
  // {
  //   artistName: 'Fleetwood Mac',
  //   artistImageUrl: placeholderAlbumArt,
  //   genres: ['Rock', 'Pop Rock'],
  //   votes: 13
  // },
  // {
  //   artistName: 'The Beatles',
  //   artistImageUrl: placeholderAlbumArt,
  //   genres: ['Rock', 'Pop Rock'],
  //   votes: 13
  // },
  // {
  //   artistName: 'The Beatles',
  //   artistImageUrl: placeholderAlbumArt,
  //   genres: ['Rock', 'Pop Rock'],
  //   votes: 13
  // },
  // {
  //   artistName: 'The Beatles',
  //   artistImageUrl: placeholderAlbumArt,
  //   genres: ['Rock', 'Pop Rock'],
  //   votes: 13
  // },
];
