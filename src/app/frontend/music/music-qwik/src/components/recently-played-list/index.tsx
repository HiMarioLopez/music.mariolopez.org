import { component$, useId, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import placeholderAlbumCover from '../../assets/50.png';
import './index.css';

// Mock data for the recently played songs
const recentlyPlayed = [
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
]

export default component$(() => {
    const elemIdSignal = useSignal<string | null>(null);
    const id = useId();
    const elemId = `${id}-scroll-container`

    useVisibleTask$(() => {
        const elem = document.getElementById(elemId);
        elemIdSignal.value = elem?.getAttribute('id') || null;

        // Ensure the scroll container is available
        if (elem) {
            const scrollAmount = () => {
                // This function will scroll the container by 1 pixel to the right
                if (elem!.scrollLeft < elem!.scrollWidth - elem!.clientWidth) {
                    elem!.scrollLeft += 1;
                } else {
                    // Reset scroll position to start
                    elem!.scrollLeft = 0;
                }
            };

            // Start scrolling
            const scrollInterval = setInterval(scrollAmount, 20); // Adjust the 20ms rate as needed for smoothness

            // Cleanup on component unmount
            return () => clearInterval(scrollInterval);
        }
    });

    return (
        <div class="recently-played-list-component styled-container">
            <h1>Recently Played</h1>
            <div class="recently-played-list-component-list-container" id={elemId}>
                {recentlyPlayed.map((play, index) => (
                    <div key={index} class="recently-played-list-component-track">
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
});
