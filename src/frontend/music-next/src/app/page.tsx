'use client';

import Navbar from '@/components/Navbar';
import NowPlaying from '@/components/NowPlaying';
import RecentlyPlayedList from '@/components/RecentlyPlayedList/index.client';
import RecommendationForm from '@/components/RecommendationForm/index.client';
import RecommendationList from '@/components/RecommendationList';
import { Song } from '@/types/Song';
import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [recommendations, setRecommendations] = useState<Song[]>([
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: '/images/50.png',
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: '/images/50.png',
    },
  ]);

  // Function to handle new recommendations
  const handleNewRecommendation = (songTitle: string) => {
    // Mock additional data
    const newRecommendation = {
      songTitle: songTitle,
      artistName: 'Mock Artist',
      albumName: 'Mock Album',
      albumCoverUrl: '/images/50.png',
    };

    setRecommendations(prevRecommendations => [...prevRecommendations, newRecommendation]);
  };

  return (
    <>
      <div className={styles.appBg} />
      <div className={styles.app}>
        <Navbar />
        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <div className={styles.nowPlayingContainer}>
              <NowPlaying />
            </div>
            <RecentlyPlayedList />
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.recommendationFormContainer}>
              <RecommendationForm onRecommend={handleNewRecommendation} />
            </div>
            <div className={styles.recommendationsListContainer}>
              <RecommendationList recommendations={recommendations} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
