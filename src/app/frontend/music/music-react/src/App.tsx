import cx from "classix";
import React from "react";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import RecentlyPlayedList from "./components/RecentlyPlayedList/RecentlyPlayedList";
import { MusicProvider } from "./providers/MusicProvider";
import styles from "./styles/App.module.css";

const App: React.FC = () => {
  return (
    <>
      <div className={styles.appBg} />
      <div className={styles.app}>
        <Navbar />
        <div className={styles.mainContent}>
          <div className={styles.centerColumn}>
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
        </div>
        <Footer />
      </div>
    </>
  );
};

export default App;
