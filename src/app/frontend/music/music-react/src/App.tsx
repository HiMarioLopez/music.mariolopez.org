import React from 'react';
import './App.css';
import NowPlaying from './components/NowPlaying/index';
import RecentlyPlayedList from './components/RecentlyPlayedList/index';
import RecommendationForm from './components/RecommendationForm/RecommendationForm';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CombinedRecommendationList from './components/CombinedRecommendationList';
// import RealtimeUpdatesCard from './components/RealtimeUpdatesCard/RealtimeUpdatesCard';
import QueuedSongsList from './components/QueuedSongsList';
import { RecommendationsProvider } from './context/RecommendationsContext';

const App: React.FC = () => {
  return (
    <>
      <div className="app-bg" />
      <div className="app">
        <Navbar />
        <div className="main-content">
          <RecommendationsProvider>
            <div className="queue-column">
              <div className="queued-songs-container">
                <QueuedSongsList />
              </div>
            </div>
            <div className="middle-column">
              <div className="now-playing-container">
                <NowPlaying />
              </div>
              <div className="recently-played-container">
                <RecentlyPlayedList />
              </div>
              {/* <div className="realtime-updates-container">
                <RealtimeUpdatesCard />
              </div> */}
            </div>
            <div className="right-column">
              <div className="recommendation-form-container">
                <RecommendationForm />
              </div>
              <div className="recommendations-list-container">
                <CombinedRecommendationList />
              </div>
            </div>
          </RecommendationsProvider>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;
