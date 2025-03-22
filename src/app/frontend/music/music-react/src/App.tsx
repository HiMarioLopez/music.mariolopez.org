import React from 'react';
import './App.css';
import NowPlaying from './components/NowPlaying/index';
import RecentlyPlayedList from './components/RecentlyPlayedList/index';
import RecommendationForm from './components/RecommendationForm/RecommendationForm';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CombinedRecommendationList from './components/CombinedRecommendationList';
import { RecommendationsProvider } from './context/RecommendationsContext';

const App: React.FC = () => {
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
            <RecommendationsProvider>
              <div className="recommendation-form-container">
                <RecommendationForm />
              </div>
              <div className="recommendations-list-container">
                <CombinedRecommendationList />
              </div>
            </RecommendationsProvider>

          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;
