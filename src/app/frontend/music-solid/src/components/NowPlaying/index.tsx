import { Component } from 'solid-js';
import './index.css';
import placeholderAlbumCover from '../../assets/300.png';
import { Song } from '../../types/Song';

// Mock data for the currently playing song
const currentSong: Song = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: placeholderAlbumCover
};

const NowPlaying: Component = () => {
    return (
        <div class="now-playing-component styled-container">
            <img src={currentSong.albumCoverUrl} alt="Album Art" />
            <div class="now-playing-component-text-container">
                <h1>Mario's Now Playing</h1>
                <div class="now-playing-component-text">
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
