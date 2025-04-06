import cx from "classix";
import React from "react";
import CombinedRecommendationList from "./components/CombinedRecommendationList/CombinedRecommendationList";
import Footer from "./components/Footer/Footer";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import QueuedSongsList from "./components/QueuedSongsList";
import RecentlyPlayedList from "./components/RecentlyPlayedList/RecentlyPlayedList";
import RecommendationForm from "./components/RecommendationForm/RecommendationForm";
import { MusicProvider } from "./providers/MusicProvider";
import { RecommendationsProvider } from "./providers/RecommendationsProvider";
import styles from "./styles/App.module.css";

const App: React.FC = () => {
  return (
    <>
      <div className={styles.appBg} />
      <div className={styles.app}>
        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <RecommendationsProvider>
              <div
                className={cx(
                  styles.recommendationFormContainer,
                  styles.styledContainer,
                )}
              >
                <RecommendationForm />
              </div>
              <div
                className={cx(
                  styles.recommendationsListContainer,
                  styles.styledContainer,
                )}
              >
                <CombinedRecommendationList />
              </div>
            </RecommendationsProvider>
          </div>
          <div className={styles.middleColumn}>
            <MusicProvider>
              <div
                className={cx(
                  styles.nowPlayingContainer,
                  styles.styledContainer,
                )}
              >
                <NowPlaying />
              </div>
              <div
                className={cx(
                  styles.recentlyPlayedContainer,
                  styles.styledContainer,
                )}
              >
                <RecentlyPlayedList />
              </div>
            </MusicProvider>
          </div>
          <div className={styles.rightColumn}>
            <div
              className={cx(
                styles.queuedSongsContainer,
                styles.styledContainer,
              )}
            >
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
