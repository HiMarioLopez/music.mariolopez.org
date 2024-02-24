import { onMount } from 'solid-js';
import './index.css';

// Mock data for the recently played songs
const recentlyPlayed = [
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
    let scrollRef: HTMLDivElement | undefined;

    onMount(() => {
        const scroll = scrollRef;

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
    });

    return (
        <div class="recently-played-list-modal">
            <h1>Recently Played</h1>
            <div class="scroll-container" ref={scrollRef}>
                {recentlyPlayed.map((play) => (
                    <div class="play-item">
                        <img src={play.albumCoverUrl} alt="Album Cover" class="album-cover" />
                        <div class="song-info">
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
