import { useState } from 'preact/hooks';
import './app.css';
import Navbar from './components/Navbar';
import NowPlaying from './components/NowPlaying';
import RecentlyPlayedList from './components/RecentlyPlayedList';
import RecommendationForm from './components/RecommendationForm';
import RecommendationList from './components/RecommendationList';
import { Song } from './types/song';
import placeholderAlbumCover from './assets/50.png';
import Footer from './components/Footer';

export function App() {
  // State to hold the list of recommendations with initial mock data
  const [recommendations, setRecommendations] = useState<Song[]>([
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: placeholderAlbumCover
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: placeholderAlbumCover
    },
  ]);

  // Function to handle new recommendations
  const handleNewRecommendation = (songTitle: string) => {
    // Mock additional data
    const newRecommendation = {
      songTitle: songTitle,
      artistName: 'Mock Artist',
      albumName: 'Mock Album',
      albumCoverUrl: placeholderAlbumCover
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
        <Footer />
      </div>
    </>
  );
}
