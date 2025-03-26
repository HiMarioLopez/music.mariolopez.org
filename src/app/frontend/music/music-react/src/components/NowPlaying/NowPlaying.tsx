import React from 'react';
import placeholderAlbumArt from '../../assets/300.png';
import './NowPlaying.styles.css';
import { useMusicContext } from '../../context/MusicContext';

// Helper function to format the relative time
const formatRelativeTime = (timestamp: string): string => {
    if (!timestamp) return '';
    
    const now = new Date();
    const playedTime = new Date(timestamp);
    const timeDiffMs = now.getTime() - playedTime.getTime();
    
    // Convert to seconds
    const seconds = Math.floor(timeDiffMs / 1000);
    
    if (seconds < 60) {
        return 'just now';
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
        const days = Math.floor(seconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
};

const NowPlaying: React.FC = () => {
    const { nowPlaying, loading, error } = useMusicContext();

    // Replace {w}x{h} in the artworkUrl with actual dimensions
    const getProcessedArtworkUrl = (url: string | undefined) => {
        if (!url) return placeholderAlbumArt;
        return url.replace('{w}x{h}', '300x300');
    };

    // Show skeleton loader during loading
    if (loading && !nowPlaying) {
        return (
            <div className="now-playing-component styled-container">
                <div className="now-playing-skeleton-img skeleton-loader"></div>
                <div className="now-playing-component-text-container">
                    <h1>Mario's Now Playing</h1>
                    <div className="now-playing-component-text">
                        <div className="now-playing-skeleton-title skeleton-loader"></div>
                        <div className="now-playing-skeleton-artist skeleton-loader"></div>
                        <div className="now-playing-skeleton-album skeleton-loader"></div>
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

    // Format the timestamp if available
    const relativeTime = nowPlaying?.processedTimestamp 
        ? formatRelativeTime(nowPlaying.processedTimestamp) 
        : '';

    return (
        <div className="now-playing-component styled-container">
            <img 
                src={getProcessedArtworkUrl(nowPlaying?.artworkUrl)} 
                alt={`${nowPlaying?.albumName || 'Album'} Art`} 
            />
            <div className="now-playing-component-text-container">
                <div className="now-playing-header">
                    <h1>Mario's Now Playing</h1>
                </div>
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
                    {relativeTime && (
                        <span className="now-playing-timestamp" title={`Played: ${new Date(nowPlaying?.processedTimestamp || '').toLocaleString()}`}>
                            {relativeTime}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
