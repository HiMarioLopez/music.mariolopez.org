'use client';

import { Song } from '@/types/Song';
import Image from 'next/image';
import React, { useEffect, useRef } from 'react';
import placeholderAlbumCover from '../../../public/images/50.png';
import styles from './style.module.css';

const recentlyPlayed: Song[] = [
    {
        songTitle: 'Song One',
        artistName: 'Artist One',
        albumName: 'Album One',
        albumCoverUrl: placeholderAlbumCover.src
    },
    {
        songTitle: 'Song Two',
        artistName: 'Artist Two',
        albumName: 'Album Two',
        albumCoverUrl: placeholderAlbumCover.src
    },
    {
        songTitle: 'Song Three',
        artistName: 'Artist Three',
        albumName: 'Album Three',
        albumCoverUrl: placeholderAlbumCover.src
    },
    {
        songTitle: 'Song Four',
        artistName: 'Artist Four',
        albumName: 'Album Four',
        albumCoverUrl: placeholderAlbumCover.src
    },
    {
        songTitle: 'Song Five',
        artistName: 'Artist Five',
        albumName: 'Album Five',
        albumCoverUrl: placeholderAlbumCover.src
    }
];

const RecentlyPlayedList: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scroll = scrollRef.current;

        if (scroll) {
            let startLeft = 0;
            const step = () => {
                if (scroll.offsetWidth + startLeft >= scroll.scrollWidth) {
                    startLeft = 0; // Reset to start if end reached
                    scroll.scrollLeft = startLeft;
                } else {
                    startLeft += 0.25; // Increment the scroll position
                    scroll.scrollLeft = startLeft;
                }
                requestAnimationFrame(step);
            };

            step();
        }

        // Cleanup function to potentially stop the animation
        return () => {
            // Reset or stop animation logic if needed
        };
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <div className={`styledContainer ${styles.recentlyPlayedListComponent}`}>
            <h1>Recently Played</h1>
            <div className={styles.recentlyPlayedListComponentListContainer} ref={scrollRef}>
                {recentlyPlayed.map((play, index) => (
                    <div key={index} className={styles.recentlyPlayedListComponentTrack}>
                        <Image src={play.albumCoverUrl} alt="Album Cover" width={50} height={50} unoptimized />
                        <div className={styles.recentlyPlayedListComponentTrackTextContainer}>
                            <h3>{play.songTitle}</h3>
                            <p>{play.artistName} - {play.albumName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyPlayedList;
