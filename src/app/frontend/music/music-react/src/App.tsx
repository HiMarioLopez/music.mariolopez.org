import cx from "classix";
import React, { useEffect } from "react";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import RecentlyPlayedList from "./components/RecentlyPlayedList/RecentlyPlayedList";
import { useMusicContext } from "./context/MusicContext";
import { MusicProvider } from "./providers/MusicProvider";
import styles from "./styles/App.module.css";

const AppContent: React.FC = () => {
  const { gradientColors } = useMusicContext();

  // Apply dynamic gradient colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--gradient-color-1', gradientColors.color1);
    root.style.setProperty('--gradient-color-2', gradientColors.color2);
    root.style.setProperty('--gradient-color-3', gradientColors.color3);
    root.style.setProperty('--gradient-color-4', gradientColors.color4);
    root.style.setProperty('--gradient-color-5', gradientColors.color5);
  }, [gradientColors]);

  return (
    <>
      <div className={styles.appBg} />
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
