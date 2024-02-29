import placeholderAlbumCover from '../../Assets/Images/300.png';
import './now-playing.css';
import { Song } from "../../Types/Song.type";

// Mock data for the currently playing song
const currentSong: Song = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: placeholderAlbumCover
};

// Root (prefix) for the component's styles
const styleRoot = "now-playing-component";

export function NowPlaying(): HTMLElement {
    const nowPlayingComponent = document.createElement('div');
    nowPlayingComponent.classList.add(styleRoot);
    nowPlayingComponent.classList.add('styled-container');

    const albumArt = document.createElement('img');
    albumArt.src = currentSong.albumCoverUrl;
    albumArt.alt = "Album Art";
    nowPlayingComponent.appendChild(albumArt);

    const contentContainer = document.createElement('div');
    contentContainer.className = `${styleRoot}-text-container`;

    const headerTitle = document.createElement('h1');
    headerTitle.textContent = "Mario's Now Playing";
    contentContainer.appendChild(headerTitle);

    const musicInfo = document.createElement('div');
    musicInfo.className = `${styleRoot}-text`;

    const songTitle = document.createElement('h2');
    songTitle.textContent = currentSong.songTitle;
    musicInfo.appendChild(songTitle);

    const artistName = document.createElement('p');
    artistName.textContent = currentSong.artistName;
    musicInfo.appendChild(artistName);

    const albumName = document.createElement('p');
    albumName.textContent = currentSong.albumName;
    musicInfo.appendChild(albumName);

    // Assemble the content container
    contentContainer.appendChild(musicInfo);

    // Append the content container to the modal
    nowPlayingComponent.appendChild(contentContainer);

    return nowPlayingComponent;
}
