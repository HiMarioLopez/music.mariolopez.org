import React from 'react';
import Image from 'next/image';
import styles from './style.module.css';
import { Song } from '@/types/Song';

// Mock data for the currently playing song
const currentSong: Song = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: "/images/300.png"
};

const NowPlaying: React.FC = () => {
    return (
        <div className={`styledContainer ${styles.nowPlayingComponent}`}>
            <Image src={currentSong.albumCoverUrl} alt="Album Art" width={300} height={300} unoptimized />
            <div className={styles.nowPlayingComponentTextContainer}>
                <h1>Mario&apos;s Now Playing</h1>
                <div className={styles.nowPlayingComponentText}>
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
