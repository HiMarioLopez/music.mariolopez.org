import { createSignal } from 'solid-js';
import './App.css';
import NowPlaying from './components/NowPlaying';
import RecentlyPlayedList from './components/RecentlyPlayedList';
import RecommendationForm from './components/RecommendationForm';
import RecommendationList from './components/RecommendationList';
import Navbar from './components/Navbar';

// Define a type for a single recommendation
type Song = {
  songTitle: string;
  artistName: string;
  albumName: string;
  albumCoverUrl: string;
};

const App = () => {
  // State to hold the list of recommendations with initial mock data
  const [recommendations, setRecommendations] = createSignal<Song[]>([
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
      <div class="app-bg" />
      <div class="app">
        <Navbar />
        <div class="main-content">
          <div class="left-column">
            <div class="now-playing-container">
              <NowPlaying />
            </div>
            <RecentlyPlayedList />
          </div>
          <div class="right-column">
            <div class="recommendation-form-container">
              <RecommendationForm onRecommend={handleNewRecommendation} />
            </div>
            <div class="recommendations-list-container">
              <RecommendationList recommendations={recommendations()} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
