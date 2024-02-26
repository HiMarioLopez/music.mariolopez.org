import React, { useState } from 'react';
import './App.css';
import NowPlaying from './components/NowPlaying/index';
import RecentlyPlayedList from './components/RecentlyPlayedList/index';
import RecommendationForm from './components/RecommendationForm/index';
import RecommendationList from './components/RecommendationList/index';
import Navbar from './components/Navbar';
import { Song } from './types/Song';

const App: React.FC = () => {
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
  };

  return (
    <>
      <div className="app-bg" />
      <div className="app">
        <Navbar />
        <div className="main-content">
          <div className="left-column">
            <div className="now-playing-container">
              <NowPlaying />
            </div>
            <RecentlyPlayedList />
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
