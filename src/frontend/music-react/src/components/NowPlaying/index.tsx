import React from 'react';
import './index.css';

// Mock data for the currently playing song
const currentSong = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: "https://via.placeholder.com/300"
};

const NowPlaying: React.FC = () => {
    return (
        <div className="now-playing-modal">
            <img src={currentSong.albumCoverUrl} alt="Album Art" className="album-art" />
            <div className="content-container">
                <h1 className="header-title">Mario's Now Playing</h1>
                <div className="music-info">
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
