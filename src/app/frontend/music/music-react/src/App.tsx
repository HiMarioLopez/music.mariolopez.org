import React, { useState } from 'react';
import './App.css';
import NowPlaying from './components/NowPlaying/index';
import RecentlyPlayedList from './components/RecentlyPlayedList/index';
import RecommendationForm from './components/RecommendationForm/RecommendationForm';
import Navbar from './components/Navbar';
import { RecommendedSong, RecommendedAlbum, RecommendedArtist } from './types/Recommendations';
import placeholderAlbumArt from './assets/50.png';
import Footer from './components/Footer';
import CombinedRecommendationList from './components/CombinedRecommendationList';

const App: React.FC = () => {
  // Separate state for each recommendation type
  const [songRecommendations, setSongRecommendations] = useState<RecommendedSong[]>([
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Three',
      artistName: 'Artist Three',
      albumName: 'Album Three',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Four',
      artistName: 'Artist Four',
      albumName: 'Album Four',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Five',
      artistName: 'Artist Five',
      albumName: 'Album Five',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Six',
      artistName: 'Artist Six',
      albumName: 'Album Six',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Seven',
      artistName: 'Artist Seven',
      albumName: 'Album Seven',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Eight',
      artistName: 'Artist Eight',
      albumName: 'Album Eight',
      albumCoverUrl: placeholderAlbumArt
    },
    {
      songTitle: 'Song Nine',
      artistName: 'Artist Nine',
      albumName: 'Album Nine',
      albumCoverUrl: placeholderAlbumArt
    },
  ]);

  const [albumRecommendations, setAlbumRecommendations] = useState<RecommendedAlbum[]>([
    {
      albumTitle: 'Album One',
      artistName: 'Artist One',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Two',
      artistName: 'Artist Two',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Three',
      artistName: 'Artist Three',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Four',
      artistName: 'Artist Four',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Five',
      artistName: 'Artist Five',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Six',
      artistName: 'Artist Six',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Seven',
      artistName: 'Artist Seven',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Eight',
      artistName: 'Artist Eight',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
    {
      albumTitle: 'Album Nine',
      artistName: 'Artist Nine',
      albumCoverUrl: placeholderAlbumArt,
      trackCount: 10
    },
  ]);

  const [artistRecommendations, setArtistRecommendations] = useState<RecommendedArtist[]>([
    {
      artistName: 'Artist One',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre One', 'Genre Two']
    },
    {
      artistName: 'Artist Two',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Three', 'Genre Four']
    },
    {
      artistName: 'Artist Three',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Five', 'Genre Six']
    },
    {
      artistName: 'Artist Four',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Seven', 'Genre Eight']
    },
    {
      artistName: 'Artist Five',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Nine', 'Genre Ten']
    },
    {
      artistName: 'Artist Six',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Eleven', 'Genre Twelve']
    },
    {
      artistName: 'Artist Seven',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Thirteen', 'Genre Fourteen']
    },
    {
      artistName: 'Artist Eight',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Fifteen', 'Genre Sixteen']
    },
    {
      artistName: 'Artist Nine',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Seventeen', 'Genre Eighteen']
    },
    {
      artistName: 'Artist Ten',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Nineteen', 'Genre Twenty']
    },
    {
      artistName: 'Artist Eleven',
      artistImageUrl: placeholderAlbumArt,
      genres: ['Genre Twenty-One', 'Genre Twenty-Two']
    },
  ]);

  // Handle new recommendations based on type
  const handleNewRecommendation = (
    type: 'song' | 'album' | 'artist',
    data: RecommendedSong | RecommendedAlbum | RecommendedArtist
  ) => {
    switch (type) {
      case 'song':
        setSongRecommendations(prev => [...prev, data as RecommendedSong]);
        break;
      case 'album':
        setAlbumRecommendations(prev => [...prev, data as RecommendedAlbum]);
        break;
      case 'artist':
        setArtistRecommendations(prev => [...prev, data as RecommendedArtist]);
        break;
    }
  };

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
            <div className="recommendation-form-container">
              <RecommendationForm onRecommend={handleNewRecommendation} />
            </div>
            <div className="recommendations-list-container">
              <CombinedRecommendationList
                songRecommendations={songRecommendations}
                albumRecommendations={albumRecommendations}
                artistRecommendations={artistRecommendations}
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;
