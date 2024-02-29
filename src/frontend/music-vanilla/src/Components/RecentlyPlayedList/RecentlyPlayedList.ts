import placeholderAlbumCover from '../../Assets/Images/50.png';
import './recently-played-list.css';
import { Song } from "../../Types/Song.type";

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

const styleRoot = 'recently-played-list-component';

export function RecentlyPlayedList(): HTMLElement {
    const component = document.createElement('div');
    component.classList.add(styleRoot);
    component.classList.add('styled-container');

    const title = document.createElement('h1');
    title.textContent = 'Recently Played';
    component.appendChild(title);

    const listContainer = document.createElement('div');
    listContainer.className = `${styleRoot}-list-container`;
    component.appendChild(listContainer);

    // Create a track for each recently played song
    recentlyPlayed.forEach((play) => {
        const track = document.createElement('div');
        track.className = `${styleRoot}-track`;

        const albumCover = document.createElement('img');
        albumCover.src = play.albumCoverUrl;
        albumCover.alt = 'Album Cover';
        track.appendChild(albumCover);

        const textContainer = document.createElement('div');
        textContainer.className = `${styleRoot}-track-text-container`;

        const songTitle = document.createElement('h3');
        songTitle.textContent = play.songTitle;
        textContainer.appendChild(songTitle);

        const artistAlbum = document.createElement('p');
        artistAlbum.textContent = `${play.artistName} - ${play.albumName}`;
        textContainer.appendChild(artistAlbum);

        track.appendChild(textContainer);
        listContainer.appendChild(track);
    });

    // Implement auto-scrolling feature
    let startLeft = 0;
    const step = () => {
        if (listContainer.offsetWidth + startLeft >= listContainer.scrollWidth) {
            startLeft = 0; // Reset to start if end reached
            listContainer.scrollLeft = startLeft;
        } else {
            startLeft += 0.25; // Increment the scroll position
            listContainer.scrollLeft = startLeft;
        }
        requestAnimationFrame(step);
    };

    step();

    return component;
}
