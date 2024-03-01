import { component$ } from '@builder.io/qwik';
import placeholderAlbumCover from '../../assets/300.png';
import './index.css';

// Mock data for the currently playing song
const currentSong = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: placeholderAlbumCover
};

export default component$(() => {
    return (
        <div class="now-playing-component styled-container">
            <img src={currentSong.albumCoverUrl} alt="Album Art" />
            <div class="now-playing-component-text-container">
                <h1 class="header-title">Mario's Now Playing</h1>
                <div class="now-playing-component-text">
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
});
