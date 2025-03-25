import React from 'react';
import Slider from 'react-slick';
import placeholderAlbumArt from '../../assets/50.png';
import { useMusicContext } from '../../context/MusicContext';
import './index.css';
// Import React Slick CSS
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const RecentlyPlayedList: React.FC = () => {
    const { recentlyPlayed, loading, error } = useMusicContext();
    
    // Replace {w}x{h} in the artworkUrl with actual dimensions for thumbnails
    const getProcessedArtworkUrl = (url: string | undefined) => {
        if (!url) return placeholderAlbumArt;
        return url.replace('{w}x{h}', '50x50');
    };

    // React Slick carousel settings
    const sliderSettings = {
        dots: false,
        arrows: false,
        infinite: true,
        speed: 6000,
        autoplay: true,
        autoplaySpeed: 0,
        cssEase: "linear",
        pauseOnHover: true,
        variableWidth: true,
        adaptiveHeight: true,
        swipeToSlide: true,
        responsive: [
            {
                breakpoint: 680,
                settings: {
                    slidesToShow: 2
                }
            }
        ]
    };

    // Show skeleton loader during loading
    if (loading && recentlyPlayed.length === 0) {
        // Create an array of 4 placeholder items for the skeleton loader
        const skeletonItems = Array(4).fill(null);
        
        return (
            <div className="recently-played-list-component styled-container">
                <h1>Recently Played</h1>
                <div className="recently-played-list-component-list-container">
                    <div className="recently-played-skeleton-container">
                        {skeletonItems.map((_, index) => (
                            <div key={`skeleton-${index}`} className="recently-played-skeleton-track">
                                <div className="recently-played-skeleton-img skeleton-loader"></div>
                                <div className="recently-played-skeleton-text">
                                    <div className="recently-played-skeleton-title skeleton-loader"></div>
                                    <div className="recently-played-skeleton-subtitle skeleton-loader"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && recentlyPlayed.length === 0) {
        return (
            <div className="recently-played-list-component styled-container">
                <h1>Recently Played</h1>
                <div className="recently-played-list-component-list-container">
                    <p>Error loading tracks: {error}</p>
                </div>
            </div>
        );
    }

    // Prepare tracks data with conditional duplication
    const tracksToDisplay = recentlyPlayed.length === 1 
        ? [...recentlyPlayed, ...recentlyPlayed, ...recentlyPlayed]
        : recentlyPlayed.length === 2 
            ? [...recentlyPlayed, ...recentlyPlayed]
            : recentlyPlayed;

    return (
        <div className="recently-played-list-component styled-container">
            <h1>Recently Played</h1>
            <div className="recently-played-list-component-list-container">
                {recentlyPlayed.length > 0 ? (
                    <Slider {...sliderSettings}>
                        {tracksToDisplay.map((track, index) => (
                            <div key={`${track.id}-${index}`}>
                                <div className="recently-played-list-component-track">
                                    <img src={getProcessedArtworkUrl(track.artworkUrl)} alt="Album Cover" />
                                    <div className="recently-played-list-component-track-text-container">
                                        <h3>{track.name}</h3>
                                        <p>{track.artistName} - {track.albumName}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                ) : (
                    <p>No recently played tracks available</p>
                )}
            </div>
        </div>
    );
};

export default RecentlyPlayedList;
