import { memo } from 'react';
import { MusicSource, getMusicSourceDisplayName } from '../../types/MusicSource';
import { AppleMusicIcon, SpotifyIcon } from '../Icons/Icons';
import styles from './SourceIndicator.module.css';

interface SourceIndicatorProps {
  source?: MusicSource;
  size?: 'small' | 'large';
}

/**
 * SourceIndicator displays a cute, minimal badge indicating the music platform source
 * Positioned as an overlay on album artwork
 * Defaults to Apple Music if no source is specified (original data source)
 */
export const SourceIndicator = memo(({ source, size = 'small' }: SourceIndicatorProps) => {
  // Default to Apple Music if no source is provided (original data source)
  // Only hide indicator if explicitly set to 'unknown'
  const actualSource: MusicSource = source && source !== 'unknown' ? source : 'apple';

  const displayName = getMusicSourceDisplayName(actualSource);
  const sizeClass = size === 'large' ? styles.large : styles.small;

  return (
    <div
      className={`${styles.indicator} ${sizeClass} ${styles[actualSource]}`}
      title={displayName}
      aria-label={`Source: ${displayName}`}
    >
      {actualSource === 'apple' && <AppleMusicIcon />}
      {actualSource === 'spotify' && <SpotifyIcon />}
    </div>
  );
});

SourceIndicator.displayName = 'SourceIndicator';
