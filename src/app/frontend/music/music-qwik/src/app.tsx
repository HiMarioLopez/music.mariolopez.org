import { $, component$, useStore } from '@builder.io/qwik';
import './app.css';
import placeholderAlbumCover from './assets/50.png';
import Footer from './components/footer';
import Navbar from './components/navbar';
import NowPlaying from './components/now-playing';
import RecentlyPlayedList from './components/recently-played-list';
import RecommendationForm from './components/recommendation-form';
import RecommendationList from './components/recommendation-list';
import { Song } from './types/Song';

export const App = component$(() => {
  const recommendations = useStore<Song[]>([
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: placeholderAlbumCover
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: placeholderAlbumCover
    },
  ]);

  const addRecommendation = $((song: Song) => {
    recommendations.push(song);
  });

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
              <RecommendationForm onAddRecommendation={addRecommendation} />
            </div>
            <div class="recommendations-list-container">
              <RecommendationList recommendations={recommendations} />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
});
