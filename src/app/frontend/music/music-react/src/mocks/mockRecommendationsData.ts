import { RecommendedSong, RecommendedAlbum, RecommendedArtist } from '../types/Recommendations';
import placeholderAlbumArt from '../assets/50.png';

// Mock song recommendations data
export const mockSongs: RecommendedSong[] = [
  {
    songTitle: 'Bohemian Rhapsody',
    artistName: 'Queen',
    albumName: 'A Night at the Opera',
    albumCoverUrl: placeholderAlbumArt,
    votes: 15
  },
  {
    songTitle: 'Hotel California',
    artistName: 'Eagles',
    albumName: 'Hotel California',
    albumCoverUrl: placeholderAlbumArt,
    votes: 12
  },
  {
    songTitle: 'Stairway to Heaven',
    artistName: 'Led Zeppelin',
    albumName: 'Led Zeppelin IV',
    albumCoverUrl: placeholderAlbumArt,
    votes: 10
  },
  {
    songTitle: 'Bohemian Rhapsody',
    artistName: 'Queen',
    albumName: 'A Night at the Opera',
    albumCoverUrl: placeholderAlbumArt,
    votes: 15
  },
  {
    songTitle: 'Hotel California',
    artistName: 'Eagles',
    albumName: 'Hotel California',
    albumCoverUrl: placeholderAlbumArt,
    votes: 12
  },
  {
    songTitle: 'Stairway to Heaven',
    artistName: 'Led Zeppelin',
    albumName: 'Led Zeppelin IV',
    albumCoverUrl: placeholderAlbumArt,
    votes: 10
  }
];

// Mock album recommendations data
export const mockAlbums: RecommendedAlbum[] = [
  {
    albumTitle: 'Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 18
  },
  {
    albumTitle: 'Thriller',
    artistName: 'Michael Jackson',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 9,
    votes: 14
  },
  {
    albumTitle: 'Abbey Road',
    artistName: 'The Beatles',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 17,
    votes: 11
  },
  {
    albumTitle: 'The Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11
  },
  {
    albumTitle: 'The Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11
  },
  {
    albumTitle: 'The Dark Side of the Moon',
    artistName: 'Pink Floyd',
    albumCoverUrl: placeholderAlbumArt,
    trackCount: 10,
    votes: 11
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