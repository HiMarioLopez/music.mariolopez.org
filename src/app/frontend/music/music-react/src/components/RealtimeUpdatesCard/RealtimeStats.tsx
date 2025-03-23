import React, { useEffect, useState } from 'react';
import { useRecommendations } from '../../context/RecommendationsContext';
import './RealtimeStats.styles.css';

type UpdateStats = {
  totalUpdates: number;
  songUpdates: number;
  albumUpdates: number;
  artistUpdates: number;
  lastUpdated: string | null;
};

const RealtimeStats: React.FC = () => {
  const { state } = useRecommendations();
  const [stats, setStats] = useState<UpdateStats>({
    totalUpdates: 0,
    songUpdates: 0,
    albumUpdates: 0,
    artistUpdates: 0,
    lastUpdated: null
  });

  // Keep a ref to the previous state to track changes
  const [prevState, setPrevState] = useState(state);

  useEffect(() => {
    // Check if any votes have changed
    let songUpdates = 0;
    let albumUpdates = 0;
    let artistUpdates = 0;

    // Check songs
    state.songs.items.forEach((song, index) => {
      if (index < prevState.songs.items.length) {
        if (song.votes !== prevState.songs.items[index].votes) {
          songUpdates++;
        }
      }
    });

    // Check albums
    state.albums.items.forEach((album, index) => {
      if (index < prevState.albums.items.length) {
        if (album.votes !== prevState.albums.items[index].votes) {
          albumUpdates++;
        }
      }
    });

    // Check artists
    state.artists.items.forEach((artist, index) => {
      if (index < prevState.artists.items.length) {
        if (artist.votes !== prevState.artists.items[index].votes) {
          artistUpdates++;
        }
      }
    });

    const totalUpdates = songUpdates + albumUpdates + artistUpdates;

    if (totalUpdates > 0) {
      const now = new Date();
      setStats(prev => ({
        totalUpdates: prev.totalUpdates + totalUpdates,
        songUpdates: prev.songUpdates + songUpdates,
        albumUpdates: prev.albumUpdates + albumUpdates,
        artistUpdates: prev.artistUpdates + artistUpdates,
        lastUpdated: now.toLocaleTimeString()
      }));
    }

    // Update the prevState
    setPrevState(state);
  }, [state, prevState]);

  if (stats.totalUpdates === 0) {
    return (
      <div className="realtime-stats">
        <div className="waiting-container">
          <p>Waiting for updates...</p>
          <div className="pulse-dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="realtime-stats">
      <h3>Real-time Stats</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Updates:</span>
          <span className="stat-value">{stats.totalUpdates}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Song Updates:</span>
          <span className="stat-value">{stats.songUpdates}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Album Updates:</span>
          <span className="stat-value">{stats.albumUpdates}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Artist Updates:</span>
          <span className="stat-value">{stats.artistUpdates}</span>
        </div>
      </div>
      {stats.lastUpdated && (
        <div className="last-update">
          <span className="stat-label">Last Update:</span>
          <span className="stat-value">{stats.lastUpdated}</span>
        </div>
      )}
    </div>
  );
};

export default RealtimeStats;