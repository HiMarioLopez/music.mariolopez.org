import React, { useState } from 'react';
import './App.css';
import NowPlaying from './components/NowPlaying/index';
import RecentlyPlayedList from './components/RecentlyPlayedList/index';
import RecommendationForm from './components/RecommendationForm/index';
import RecommendationList from './components/RecommendationList/index';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  // Define a type for a single recommendation
  type Song = {
    songTitle: string;
    artistName: string;
    albumName: string;
    albumCoverUrl: string;
  };

  // Mock data for the currently playing song
  const [currentSong] = useState({
    albumArt: 'https://via.placeholder.com/300',
    songTitle: 'Example Song',
    artist: 'Example Artist',
    album: 'Example Album',
  });

  // State to hold the list of recommendations with initial mock data
  const [recommendations, setRecommendations] = useState<Song[]>([
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
  ]);

  // State to hold the list of recommendations with initial mock data
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Three',
      artistName: 'Artist Three',
      albumName: 'Album Three',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Four',
      artistName: 'Artist Four',
      albumName: 'Album Four',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Five',
      artistName: 'Artist Five',
      albumName: 'Album Five',
      albumCoverUrl: 'https://via.placeholder.com/50',
    }
  ]);

  // Function to handle new recommendations
  const handleNewRecommendation = (songTitle: string) => {
    // Mock additional data
    const newRecommendation = {
      songTitle: songTitle,
      artistName: 'Mock Artist',
      albumName: 'Mock Album',
      albumCoverUrl: 'https://via.placeholder.com/50',
    };

    setRecommendations(prevRecommendations => [...prevRecommendations, newRecommendation]);
    setRecentlyPlayed(prevRecentlyPlayed => [...prevRecentlyPlayed, newRecommendation]);
  };

  return (
    <>
      {/* REF: https://css-tricks.com/the-fixed-background-attachment-hack/ */}
      <div className="app-bg" />
      <div className="app">
        <Navbar />
        <div className="main-content">
          <div className="left-column">
            <div className="now-playing-container">
              <NowPlaying
                albumArt={currentSong.albumArt}
                songTitle={currentSong.songTitle}
                artist={currentSong.artist}
                album={currentSong.album}
              />
            </div>
            <RecentlyPlayedList recentlyPlayed={recentlyPlayed} />
          </div>
          <div className="right-column">
            <div className="recommendation-form-container">
              <RecommendationForm onRecommend={handleNewRecommendation} />
            </div>
            <div className="recommendations-list-container">
              <RecommendationList recommendations={recommendations} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
