import React, { useState } from 'react';
import './App.css';
import NowPlaying from './components/NowPlaying/index';
import RecommendationForm from './components/RecommendationForm/index';
import RecommendationList from './components/RecommendationList/index';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  // Define a type for a single recommendation
  type Recommendation = {
    songTitle: string;
    artistName: string;
    albumName: string;
    albumCoverUrl: string;
  };

  // Mock data for the currently playing song
  const [currentSong] = useState({
    albumArt: 'https://via.placeholder.com/250',
    songTitle: 'Example Song',
    artist: 'Example Artist',
    album: 'Example Album',
  });

  // State to hold the list of recommendations with initial mock data
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
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

  // Function to handle new recommendations
  const handleNewRecommendation = (songTitle: string) => {
    // Mock additional data
    const newRecommendation = {
      songTitle: songTitle,
      artistName: 'Mock Artist',
      albumName: 'Mock Album',
      albumCoverUrl: 'https://via.placeholder.com/50',
    };

    // Update the recommendations list with the new mock recommendation
    setRecommendations(prevRecommendations => [...prevRecommendations, newRecommendation]);
  };

  return (
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
  );
}

export default App;
