import React from "react";
import "./App.css";
import CombinedRecommendationList from "./components/CombinedRecommendationList";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import QueuedSongsList from "./components/QueuedSongsList";
import RecentlyPlayedList from "./components/RecentlyPlayedList/RecentlyPlayedList";
import RecommendationForm from "./components/RecommendationForm/RecommendationForm";
import { MusicProvider } from "./context/MusicContext";
import { RecommendationsProvider } from "./context/RecommendationsContext";

const App: React.FC = () => {
  return (
    <>
      <div className="app-bg" />
      <div className="app">
        <Navbar />
        <div className="main-content">
          <div className="left-column">
            <RecommendationsProvider>
              <div className="recommendation-form-container">
                <RecommendationForm />
              </div>
              <div className="recommendations-list-container">
                <CombinedRecommendationList />
              </div>
            </RecommendationsProvider>
          </div>
          <div className="middle-column">
            <MusicProvider>
              <div className="now-playing-container">
                <NowPlaying />
              </div>
              <div className="recently-played-container">
                <RecentlyPlayedList />
              </div>
            </MusicProvider>
          </div>
          <div className="right-column">
            <div className="queued-songs-container">
              <QueuedSongsList />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default App;
