import cx from "classix";
import React, { lazy, Suspense } from "react";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import SkeletonLoader from "./components/RecentlyPlayedList/components/SkeletonLoader";
import recentlyPlayedStyles from "./components/RecentlyPlayedList/styles/RecentlyPlayedList.module.css";
import { useMusicContext } from "./context/MusicContext";
import { MusicProvider } from "./providers/MusicProvider";
import styles from "./styles/App.module.css";

// Lazy load heavy components to reduce initial bundle size
// Reference: https://react.dev/reference/react/lazy
const AnimatedBackground = lazy(
  () => import("./components/AnimatedBackground/AnimatedBackground"),
);
const RecentlyPlayedList = lazy(
  () => import("./components/RecentlyPlayedList/RecentlyPlayedList"),
);

const AppContent: React.FC = () => {
  const { gradientColors } = useMusicContext();

  return (
    <>
      <Suspense
        fallback={
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
        }
      >
        <AnimatedBackground colors={gradientColors} />
      </Suspense>
      <div className={styles.app}>
        <Navbar />
        <main className={styles.mainContent} role="main">
          <div className={styles.centerColumn}>
            <article
              className={cx(styles.nowPlayingContainer, styles.styledContainer)}
              aria-label="Currently playing song"
            >
              <NowPlaying />
            </article>
            <section
              className={cx(
                styles.recentlyPlayedContainer,
                styles.styledContainer,
              )}
              aria-label="Recently played songs"
            >
              <Suspense
                fallback={
                  <div
                    className={recentlyPlayedStyles.recentlyPlayedListComponent}
                    aria-busy="true"
                  >
                    <h1>Recently Played</h1>
                    <SkeletonLoader />
                  </div>
                }
              >
                <RecentlyPlayedList />
              </Suspense>
            </section>
          </div>
        </main>
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
