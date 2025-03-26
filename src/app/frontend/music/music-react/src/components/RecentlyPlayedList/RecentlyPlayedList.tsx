import React from "react";
import Slider from "react-slick";
import placeholderAlbumArt from "../../assets/50.png";
import { useMusicContext } from "../../context/MusicContext";
import "./RecentlyPlayedList.styles.css";

// Import React Slick CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const RecentlyPlayedList: React.FC = () => {
  const { recentlyPlayed, loading, error } = useMusicContext();

  // Replace {w}x{h} in the artworkUrl with actual dimensions for thumbnails
  const getProcessedArtworkUrl = (url: string | undefined) => {
    if (!url) return placeholderAlbumArt;
    return url.replace("{w}x{h}", "50x50");
  };

  // React Slick carousel settings for top row - moves right to left
  const topSliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 16000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: true,
    variableWidth: true,
    swipeToSlide: true,
    rtl: false, // Right to left is false - moves left to right
  };

  // React Slick carousel settings for bottom row - moves left to right
  const bottomSliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 20000, // Slightly different speed for visual interest
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: true,
    variableWidth: true,
    swipeToSlide: true,
    rtl: true, // Right to left is true - moves right to left
  };

  // Show skeleton loader during loading
  if (loading && recentlyPlayed.length === 0) {
    // Create an array of 4 placeholder items for each row
    const skeletonItems = Array(4).fill(null);

    return (
      <div className="recently-played-list-component styled-container">
        <h1>Recently Played</h1>
        <div className="recently-played-list-component-list-container">
          <div className="recently-played-skeleton-container">
            {/* Top row of skeletons */}
            <div className="recently-played-skeleton-row">
              {skeletonItems.map((_, index) => (
                <div
                  key={`skeleton-top-${index}`}
                  className="recently-played-skeleton-track"
                >
                  <div className="recently-played-skeleton-img skeleton-loader"></div>
                  <div className="recently-played-skeleton-text">
                    <div className="recently-played-skeleton-title skeleton-loader"></div>
                    <div className="recently-played-skeleton-subtitle skeleton-loader"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom row of skeletons */}
            <div className="recently-played-skeleton-row">
              {skeletonItems.map((_, index) => (
                <div
                  key={`skeleton-bottom-${index}`}
                  className="recently-played-skeleton-track"
                >
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

  // Prepare track data - split into two arrays for top and bottom rows
  // If we have fewer than 8 tracks, we'll duplicate them to ensure enough content
  const processedTracks =
    recentlyPlayed.length < 8
      ? [...recentlyPlayed, ...recentlyPlayed]
      : [...recentlyPlayed];

  // Split tracks into two arrays for top and bottom sliders
  const halfwayIndex = Math.ceil(processedTracks.length / 2);
  const topRowTracks = processedTracks.slice(0, halfwayIndex);
  const bottomRowTracks =
    processedTracks.slice(halfwayIndex).length > 0
      ? processedTracks.slice(halfwayIndex)
      : [...topRowTracks]; // Fallback if not enough tracks

  return (
    <div className="recently-played-list-component styled-container">
      <h1>Recently Played</h1>
      <div className="recently-played-list-component-list-container">
        {recentlyPlayed.length > 0 ? (
          <>
            {/* Top row slider */}
            <div className="recently-played-list-row">
              <Slider {...topSliderSettings}>
                {topRowTracks.map((track, index) => (
                  <div key={`top-${track.id}-${index}`}>
                    <div className="recently-played-list-component-track">
                      <img
                        src={getProcessedArtworkUrl(track.artworkUrl)}
                        alt={`${track.name} Album Cover`}
                        title={`${track.name} by ${track.artistName}`}
                      />
                      <div className="recently-played-list-component-track-text-container">
                        <h3 title={track.name}>{track.name}</h3>
                        <p title={`${track.artistName} - ${track.albumName}`}>
                          {track.artistName} - {track.albumName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

            {/* Bottom row slider */}
            <div className="recently-played-list-row">
              <Slider {...bottomSliderSettings}>
                {bottomRowTracks.map((track, index) => (
                  <div key={`bottom-${track.id}-${index}`}>
                    <div className="recently-played-list-component-track">
                      <img
                        src={getProcessedArtworkUrl(track.artworkUrl)}
                        alt={`${track.name} Album Cover`}
                        title={`${track.name} by ${track.artistName}`}
                      />
                      <div className="recently-played-list-component-track-text-container">
                        <h3 title={track.name}>{track.name}</h3>
                        <p title={`${track.artistName} - ${track.albumName}`}>
                          {track.artistName} - {track.albumName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </>
        ) : (
          <p>No recently played tracks available</p>
        )}
      </div>
    </div>
  );
};

export default RecentlyPlayedList;
