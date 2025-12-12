import React, {
  memo,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AppleMusicSong } from "../../../models/AppleMusicSong";
import styles from "../styles/CarouselRow.module.css";
import SongItem from "./SongItem";

interface CarouselRowProps {
  songs: AppleMusicSong[];
  settings: {
    speed: number; // Duration in ms for one complete cycle
    direction: "left" | "right"; // Direction of movement
  };
  rowName: string;
}

/**
 * Carousel row component using CSS animations for seamless infinite scrolling
 * with pause on hover
 */
const CarouselRow: React.FC<CarouselRowProps> = ({
  songs,
  settings,
  rowName,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  // Memoize duplicated songs to prevent recalculation on every render
  // Duplicate songs multiple times for seamless infinite scroll
  // Need enough duplicates to ensure seamless looping
  const duplicatedSongs = useMemo(
    () => [...songs, ...songs, ...songs],
    [songs],
  );

  // Calculate content width (width of one set of songs)
  const updateContentWidth = useCallback(() => {
    if (trackRef.current) {
      const items = trackRef.current.querySelectorAll("[data-carousel-item]");
      if (items.length > 0) {
        let totalWidth = 0;
        const thirdLength = items.length / 3;
        for (let i = 0; i < thirdLength; i++) {
          totalWidth += (items[i] as HTMLElement).offsetWidth;
        }
        setContentWidth(totalWidth);
      }
    }
  }, []);

  useEffect(() => {
    // Wait for items to render, then measure
    const timeoutId = setTimeout(() => {
      updateContentWidth();
    }, 100);

    window.addEventListener("resize", updateContentWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateContentWidth);
    };
  }, [songs, updateContentWidth]);

  // Update CSS custom properties for animation
  useEffect(() => {
    if (trackRef.current && contentWidth > 0) {
      const track = trackRef.current;
      const duration = settings.speed / 1000; // Convert ms to seconds

      track.style.setProperty("--carousel-content-width", `${contentWidth}px`);
      track.style.setProperty("--carousel-duration", `${duration}s`);
    }
  }, [contentWidth, settings.speed]);

  // Memoize mouse event handlers to prevent recreation on every render
  // Must be before any early returns (React hooks rule)
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (songs.length === 0) {
    return null;
  }

  // Determine animation class based on direction
  const animationClass =
    settings.direction === "right"
      ? styles.carouselTrackRight
      : styles.carouselTrackLeft;

  return (
    <div
      className={styles.recentlyPlayedListRow}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label={`${rowName} carousel of recently played songs`}
      aria-live="polite"
    >
      <div className={styles.carouselContainer}>
        <div
          ref={trackRef}
          className={`${styles.carouselTrack} ${animationClass} ${isHovered ? styles.carouselTrackPaused : ""}`}
          aria-hidden="false"
        >
          {duplicatedSongs.map((song, index) => (
            <div
              key={`${rowName}-${song.id}-${index}`}
              data-carousel-item
              className={styles.carouselItem}
            >
              <SongItem song={song} index={index} rowName={rowName} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(CarouselRow);
