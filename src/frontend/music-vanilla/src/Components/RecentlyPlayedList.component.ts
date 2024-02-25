import { Song } from "../Types/Song.type";
import '../Assets/Styles/RecentlyPlayedList.styles.css';

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

export function RecentlyPlayedList(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'recently-played-list-modal';

    const title = document.createElement('h1');
    title.textContent = 'Recently Played';
    modal.appendChild(title);

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'scroll-container';
    modal.appendChild(scrollContainer);

    recentlyPlayed.forEach((play) => {
        const playItem = document.createElement('div');
        playItem.className = 'play-item';

        const albumCover = document.createElement('img');
        albumCover.src = play.albumCoverUrl;
        albumCover.alt = 'Album Cover';
        albumCover.className = 'album-cover';
        playItem.appendChild(albumCover);

        const songInfo = document.createElement('div');
        songInfo.className = 'song-info';

        const songTitle = document.createElement('h3');
        songTitle.textContent = play.songTitle;
        songInfo.appendChild(songTitle);

        const artistAlbum = document.createElement('p');
        artistAlbum.textContent = `${play.artistName} - ${play.albumName}`;
        songInfo.appendChild(artistAlbum);

        playItem.appendChild(songInfo);
        scrollContainer.appendChild(playItem);
    });

    // Implement auto-scrolling feature
    let startLeft = 0;
    const step = () => {
        if (scrollContainer.offsetWidth + startLeft >= scrollContainer.scrollWidth) {
            startLeft = 0; // Reset to start if end reached
            scrollContainer.scrollLeft = startLeft;
        } else {
            startLeft += 0.25; // Increment the scroll position
            scrollContainer.scrollLeft = startLeft;
        }
        requestAnimationFrame(step);
    };

    step();

    return modal;
}
