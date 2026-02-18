import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { AppleMusicSong } from "../../models/AppleMusicSong";
import type { CarouselSettings } from "../../hooks/useCarouselSettings";
import { useCarouselSettings } from "../../hooks/useCarouselSettings";
import { useSongDistribution } from "../../hooks/useSongDistribution";
import { getProcessedArtworkUrl } from "../../utils/imageProcessing";
import { openUrlInNewTab } from "../../utils/navigation";
import SourceIndicator from "../SourceIndicator";
import "./index.css";

type RecentlyPlayedListProps = {
  recentlyPlayed: AppleMusicSong[];
  loading: boolean;
  error: string | null;
};

type CarouselRowProps = {
  songs: AppleMusicSong[];
  settings: CarouselSettings;
  rowName: string;
};

type SongItemProps = {
  song: AppleMusicSong;
  index: number;
  rowName: string;
};

const SongItem = ({ song, index, rowName }: SongItemProps) => {
  const [imageError, setImageError] = useState(false);
  const artworkUrl = useMemo(() => getProcessedArtworkUrl(song.artworkUrl), [song.artworkUrl]);

  return (
    <div key={`${rowName}-${song.id}-${index}`}>
      <div className="song">
        <div className="album-art-container">
          <img
            src={imageError ? getProcessedArtworkUrl(undefined) : artworkUrl}
            alt={`${song.name} Album Cover`}
            title={
              song.url
                ? `Click to open ${song.name} in Apple Music`
                : `${song.name} by ${song.artistName}`
            }
            onError={() => {
              setImageError(true);
            }}
            onClick={() => {
              openUrlInNewTab(song.url);
            }}
            style={{ cursor: song.url ? "pointer" : "default" }}
          />
        </div>
        <div className="song-text-container">
          <div className="song-title-container">
            <SourceIndicator source={song.source} size="small" url={song.url} />
            <h3 title={song.name}>{song.name}</h3>
          </div>
          <p title={`${song.artistName} - ${song.albumName}`}>
            {song.artistName} - {song.albumName}
          </p>
        </div>
      </div>
    </div>
  );
};

const CarouselRow = ({ songs, settings, rowName }: CarouselRowProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  const duplicatedSongs = useMemo(() => [...songs, ...songs, ...songs], [songs]);

  const updateContentWidth = useCallback(() => {
    if (!trackRef.current) {
      return;
    }

    const items = trackRef.current.querySelectorAll("[data-carousel-item]");
    if (items.length === 0) {
      setContentWidth(0);
      return;
    }

    let totalWidth = 0;
    const thirdLength = items.length / 3;
    for (let index = 0; index < thirdLength; index += 1) {
      totalWidth += (items[index] as HTMLElement).offsetWidth;
    }
    setContentWidth(totalWidth);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      updateContentWidth();
    }, 100);

    window.addEventListener("resize", updateContentWidth);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updateContentWidth);
    };
  }, [songs, updateContentWidth]);

  useEffect(() => {
    if (!trackRef.current || contentWidth <= 0) {
      return;
    }
    const duration = settings.speed / 1000;
    trackRef.current.style.setProperty("--carousel-content-width", `${contentWidth}px`);
    trackRef.current.style.setProperty("--carousel-duration", `${duration}s`);
  }, [contentWidth, settings.speed]);

  if (songs.length === 0) {
    return null;
  }

  return (
    <div
      className="recently-played-list-row"
      role="region"
      aria-label={`${rowName} carousel of recently played songs`}
      aria-live="polite"
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div className="carousel-container">
        <div
          ref={trackRef}
          className={`carousel-track ${settings.direction === "right" ? "carousel-track-right" : "carousel-track-left"} ${isHovered ? "carousel-track-paused" : ""}`}
        >
          {duplicatedSongs.map((song, index) => (
            <div key={`${rowName}-${song.id}-${index}`} data-carousel-item className="carousel-item">
              <SongItem song={song} index={index} rowName={rowName} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => {
  const skeletonRows = [1, 2, 3];
  const skeletonItems = [1, 2, 3, 4];

  return (
    <div className="recently-played-skeleton-container">
      {skeletonRows.map((row) => (
        <div key={`skeleton-row-${row}`} className="recently-played-skeleton-row">
          {skeletonItems.map((item) => (
            <div key={`skeleton-${row}-${item}`} className="recently-played-skeleton-song">
              <div className="recently-played-skeleton-img skeleton-loader"></div>
              <div className="recently-played-skeleton-text">
                <div className="recently-played-skeleton-title skeleton-loader"></div>
                <div className="recently-played-skeleton-subtitle skeleton-loader"></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const RecentlyPlayedList = ({ recentlyPlayed, loading, error }: RecentlyPlayedListProps) => {
  const { topSliderSettings, middleSliderSettings, bottomSliderSettings } = useCarouselSettings();
  const { topRowSongs, middleRowSongs, bottomRowSongs } = useSongDistribution(recentlyPlayed);

  return (
    <div className="recently-played-list-component">
      <h1>Recently Played</h1>
      {loading && recentlyPlayed.length === 0 && <SkeletonLoader />}

      {!loading && error && recentlyPlayed.length === 0 && <p>Error loading songs: {error}</p>}

      {!loading && !error && recentlyPlayed.length > 0 && (
        <>
          <CarouselRow songs={topRowSongs} settings={topSliderSettings} rowName="top" />
          <CarouselRow songs={middleRowSongs} settings={middleSliderSettings} rowName="middle" />
          <CarouselRow songs={bottomRowSongs} settings={bottomSliderSettings} rowName="bottom" />
        </>
      )}

      {!loading && !error && recentlyPlayed.length === 0 && (
        <p>No recently played songs available</p>
      )}
    </div>
  );
};

export default RecentlyPlayedList;
