import { onMount } from 'solid-js';
import placeholderAlbumCover from '../../assets/300.png';
import { Song } from '../../types/Song';
import './index.css';

// Mock data for the recently played songs
const recentlyPlayed: Song[] = [
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
    {
        songTitle: 'Song Three',
        artistName: 'Artist Three',
        albumName: 'Album Three',
        albumCoverUrl: placeholderAlbumCover
    },
    {
        songTitle: 'Song Four',
        artistName: 'Artist Four',
        albumName: 'Album Four',
        albumCoverUrl: placeholderAlbumCover
    },
    {
        songTitle: 'Song Five',
        artistName: 'Artist Five',
        albumName: 'Album Five',
        albumCoverUrl: placeholderAlbumCover
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
        <div class="recently-played-list-component styled-container">
            <h1>Recently Played</h1>
            <div class="recently-played-list-component-list-container" ref={scrollRef}>
                {recentlyPlayed.map((play) => (
                    <div class="recently-played-list-component-track">
                        <img src={play.albumCoverUrl} alt="Album Cover" />
                        <div class="recently-played-list-component-track-text-container">
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
