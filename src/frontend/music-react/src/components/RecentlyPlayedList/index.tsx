import React, { useEffect, useRef } from 'react';
import './index.css';

type RecentlyPlayed = {
    songTitle: string;
    albumName: string;
    artistName: string;
    albumCoverUrl: string;
};

type RecentlyPlayedListProps = {
    recentlyPlayed: RecentlyPlayed[];
};

const RecentlyPlayedList: React.FC<RecentlyPlayedListProps> = ({ recentlyPlayed }) => {
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
        <div className="recently-played-list-modal">
            <h1>Recently Played</h1>
            <div className="scroll-container" ref={scrollRef}>
                {recentlyPlayed.map((play, index) => (
                    <div key={index} className="play-item">
                        <img src={play.albumCoverUrl} alt="Album Cover" className="album-cover" />
                        <div className="song-info">
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
