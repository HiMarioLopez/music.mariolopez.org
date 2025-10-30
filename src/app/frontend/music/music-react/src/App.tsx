import cx from "classix";
import React from "react";
import AnimatedBackground from "./components/AnimatedBackground/AnimatedBackground";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import RecentlyPlayedList from "./components/RecentlyPlayedList/RecentlyPlayedList";
import { useMusicContext } from "./context/MusicContext";
import { MusicProvider } from "./providers/MusicProvider";
import styles from "./styles/App.module.css";

const AppContent: React.FC = () => {
  const { gradientColors } = useMusicContext();

  return (
    <>
      <AnimatedBackground colors={gradientColors} />
      <div className={styles.app}>
        <Navbar />
        <div className={styles.mainContent}>
          <div className={styles.centerColumn}>
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
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
};

export default App;
