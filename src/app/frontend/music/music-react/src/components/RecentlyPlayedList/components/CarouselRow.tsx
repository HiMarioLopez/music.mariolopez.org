import React, { memo } from "react";
import Slider from "react-slick";
import { AppleMusicSong } from "../../../models/AppleMusicSong";
import styles from "../styles/CarouselRow.module.css";
import SongItem from "./SongItem";

interface CarouselRowProps {
  songs: AppleMusicSong[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any; // React-slick settings
  rowName: string;
}

/**
 * Carousel row component for displaying a horizontal scrolling list of songs
 */
const CarouselRow: React.FC<CarouselRowProps> = ({
  songs,
  settings,
  rowName,
}) => {
  return (
    <div className={styles.recentlyPlayedListRow}>
      <Slider {...settings}>
        {songs.map((song, index) => (
          <SongItem
            key={`${rowName}-${song.id}-${index}`}
            song={song}
            index={index}
            rowName={rowName}
          />
        ))}
      </Slider>
    </div>
  );
};

export default memo(CarouselRow);
