import "./app.css";
import AnimatedBackground from "./components/AnimatedBackground";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import NowPlaying from "./components/NowPlaying";
import RecentlyPlayedList from "./components/RecentlyPlayedList";
import { useMusicStore } from "./hooks/useMusicStore";

export function App() {
  const { nowPlaying, recentlyPlayed, loading, error, gradientColors } = useMusicStore();

  return (
    <>
      <AnimatedBackground colors={gradientColors} />
      <div className="app">
        <Navbar />
        <main className="main-content" role="main">
          <div className="center-column">
            <div className="now-playing-container styled-container">
              <NowPlaying nowPlaying={nowPlaying} loading={loading} error={error} />
            </div>
            <div className="recently-played-container styled-container">
              <RecentlyPlayedList
                recentlyPlayed={recentlyPlayed}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
