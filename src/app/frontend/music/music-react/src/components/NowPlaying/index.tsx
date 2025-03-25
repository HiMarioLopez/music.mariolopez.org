import React from 'react';
import placeholderAlbumArt from '../../assets/300.png';
import './index.css';
import { useMusicContext } from '../../context/MusicContext';

const NowPlaying: React.FC = () => {
    const { nowPlaying, loading, error } = useMusicContext();

    // Replace {w}x{h} in the artworkUrl with actual dimensions
    const getProcessedArtworkUrl = (url: string | undefined) => {
        if (!url) return placeholderAlbumArt;
        return url.replace('{w}x{h}', '300x300');
    };

    // Show loading state
    if (loading && !nowPlaying) {
        return (
            <div className="now-playing-component styled-container">
                <img src={placeholderAlbumArt} alt="Loading Album Art" />
                <div className="now-playing-component-text-container">
                    <h1>Mario's Now Playing</h1>
                    <div className="now-playing-component-text">
                        <h2>Loading...</h2>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !nowPlaying) {
        return (
            <div className="now-playing-component styled-container">
                <img src={placeholderAlbumArt} alt="Error Album Art" />
                <div className="now-playing-component-text-container">
                    <h1>Mario's Now Playing</h1>
                    <div className="now-playing-component-text">
                        <h2>Unable to load music data</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="now-playing-component styled-container">
            <img 
                src={getProcessedArtworkUrl(nowPlaying?.artworkUrl)} 
                alt={`${nowPlaying?.albumName || 'Album'} Art`} 
            />
            <div className="now-playing-component-text-container">
                <h1>Mario's Now Playing</h1>
                <div className="now-playing-component-text">
                    <h2 title={nowPlaying?.name || 'No song playing'}>
                        {nowPlaying?.name || 'No song playing'}
                    </h2>
                    <p title={nowPlaying?.artistName || 'Unknown Artist'}>
                        {nowPlaying?.artistName || 'Unknown Artist'}
                    </p>
                    <p title={nowPlaying?.albumName || 'Unknown Album'}>
                        {nowPlaying?.albumName || 'Unknown Album'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
