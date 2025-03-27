import React from "react";
import placeholderAlbumArt from "../../assets/300.png";
import "./index.css";

// Mock data for queued songs
const queuedSongs = [
  {
    id: 1,
    songTitle: "Queued Song 1",
    artistName: "Artist 1",
    albumName: "Album 1",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 2,
    songTitle: "Queued Song 2",
    artistName: "Artist 2",
    albumName: "Album 2",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 3,
    songTitle: "Queued Song 3",
    artistName: "Artist 3",
    albumName: "Album 3",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 4,
    songTitle: "Queued Song 4",
    artistName: "Artist 4",
    albumName: "Album 4",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 5,
    songTitle: "Queued Song 5",
    artistName: "Artist 5",
    albumName: "Album 5",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 6,
    songTitle: "Queued Song 6",
    artistName: "Artist 6",
    albumName: "Album 6",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 7,
    songTitle: "Queued Song 7",
    artistName: "Artist 7",
    albumName: "Album 7",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 8,
    songTitle: "Queued Song 8",
    artistName: "Artist 8",
    albumName: "Album 8",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 9,
    songTitle: "Queued Song 9",
    artistName: "Artist 9",
    albumName: "Album 9",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 10,
    songTitle: "Queued Song 10",
    artistName: "Artist 10",
    albumName: "Album 10",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 11,
    songTitle: "Queued Song 11",
    artistName: "Artist 11",
    albumName: "Album 11",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 12,
    songTitle: "Queued Song 12",
    artistName: "Artist 12",
    albumName: "Album 12",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 13,
    songTitle: "Queued Song 13",
    artistName: "Artist 13",
    albumName: "Album 13",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 14,
    songTitle: "Queued Song 14",
    artistName: "Artist 14",
    albumName: "Album 14",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 15,
    songTitle: "Queued Song 15",
    artistName: "Artist 15",
    albumName: "Album 15",
    albumCoverUrl: placeholderAlbumArt,
  },
  {
    id: 16,
    songTitle: "Queued Song 16",
    artistName: "Artist 16",
    albumName: "Album 16",
    albumCoverUrl: placeholderAlbumArt,
  },
];

const QueuedSongsList: React.FC = () => {
  return (
    <div className="queued-songs-component styled-container">
      <h1>Up Next</h1>
      <div className="queued-songs-list">
        {queuedSongs.map((song) => (
          <div key={song.id} className="queued-song-item">
            <img src={song.albumCoverUrl} alt={`${song.albumName} album art`} />
            <div className="queued-song-info">
              <h3>{song.songTitle}</h3>
              <p>{song.artistName}</p>
              <p className="album-name">{song.albumName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueuedSongsList;
