import { Song } from "../Types/Song.type";
import '../Assets/Styles/NowPlaying.styles.css';

// Mock data for the currently playing song
const currentSong: Song = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: "https://via.placeholder.com/300"
};

export function NowPlaying(): HTMLElement {
    const nowPlayingModal = document.createElement('div');
    nowPlayingModal.className = 'now-playing-modal';

    const albumArt = document.createElement('img');
    albumArt.src = currentSong.albumCoverUrl;
    albumArt.alt = "Album Art";
    albumArt.className = "album-art";
    nowPlayingModal.appendChild(albumArt);

    const contentContainer = document.createElement('div');
    contentContainer.className = "content-container";

    const headerTitle = document.createElement('h1');
    headerTitle.className = "header-title";
    headerTitle.textContent = "Mario's Now Playing";
    contentContainer.appendChild(headerTitle);

    const musicInfo = document.createElement('div');
    musicInfo.className = "music-info";

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
    nowPlayingModal.appendChild(contentContainer);

    return nowPlayingModal;
}
