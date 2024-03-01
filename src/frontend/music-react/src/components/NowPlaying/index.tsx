import React from 'react';
import placeholderAlbumArt from '../../assets/300.png';
import './index.css';

// Mock data for the currently playing song
const currentSong = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: placeholderAlbumArt
};

const NowPlaying: React.FC = () => {
    return (
        <div className="now-playing-component styled-container">
            <img src={currentSong.albumCoverUrl} alt="Album Art" />
            <div className="now-playing-component-text-container">
                <h1>Mario's Now Playing</h1>
                <div className="now-playing-component-text">
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
