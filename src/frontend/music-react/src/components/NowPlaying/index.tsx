import React from 'react';
import './index.css';

type NowPlayingProps = {
    albumArt: string;
    songTitle: string;
    artist: string;
    album: string;
};

const NowPlaying: React.FC<NowPlayingProps> = ({ albumArt, songTitle, artist, album }) => {
    return (
        <div className="now-playing-modal">
            <img src={albumArt} alt="Album Art" className="album-art" />
            <div className="content-container">
                <h1 className="header-title">Mario's Now Playing</h1>
                <div className="music-info">
                    <h2>{songTitle}</h2>
                    <p>{artist}</p>
                    <p>{album}</p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
