import { component$ } from '@builder.io/qwik';
import './index.css';

// Mock data for the currently playing song
const currentSong = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: "https://via.placeholder.com/300"
};

export default component$(() => {
    return (
        <div class="now-playing-modal">
            <img src={currentSong.albumCoverUrl} alt="Album Art" class="album-art" />
            <div class="content-container">
                <h1 class="header-title">Mario's Now Playing</h1>
                <div class="music-info">
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
});
