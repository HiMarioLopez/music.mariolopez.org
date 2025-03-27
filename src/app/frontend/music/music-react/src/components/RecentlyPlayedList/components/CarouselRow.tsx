import React, { memo } from "react";
import Slider from "react-slick";
import { MusicItem } from "../../../context/MusicContext";
import styles from "../styles/CarouselRow.module.css";
import TrackItem from "./TrackItem";

interface CarouselRowProps {
  tracks: MusicItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any; // React-slick settings
  rowName: string;
}

/**
 * Carousel row component for displaying a horizontal scrolling list of tracks
 */
const CarouselRow: React.FC<CarouselRowProps> = ({
  tracks,
  settings,
  rowName,
}) => {
  return (
    <div className={styles.recentlyPlayedListRow}>
      <Slider {...settings}>
        {tracks.map((track, index) => (
          <TrackItem
            key={`${rowName}-${track.id}-${index}`}
            track={track}
            index={index}
            rowName={rowName}
          />
        ))}
      </Slider>
    </div>
  );
};

export default memo(CarouselRow);
