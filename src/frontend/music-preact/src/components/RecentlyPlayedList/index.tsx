import { useEffect, useRef } from 'preact/hooks'; // Import hooks from preact/hooks
import './index.css';
import { Song } from '../../types/song';

// Mock data for the recently played songs
const recentlyPlayed: Song[] = [
    {
        songTitle: 'Song One',
        artistName: 'Artist One',
        albumName: 'Album One',
        albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
        songTitle: 'Song Two',
        artistName: 'Artist Two',
        albumName: 'Album Two',
        albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
        songTitle: 'Song Three',
        artistName: 'Artist Three',
        albumName: 'Album Three',
        albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
        songTitle: 'Song Four',
        artistName: 'Artist Four',
        albumName: 'Album Four',
        albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
        songTitle: 'Song Five',
        artistName: 'Artist Five',
        albumName: 'Album Five',
        albumCoverUrl: 'https://via.placeholder.com/50',
    }
];

const RecentlyPlayedList = () => {
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