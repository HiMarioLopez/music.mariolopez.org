import { memo } from 'react';
import { MusicSource, getMusicSourceDisplayName } from '../../types/MusicSource';
import { AppleMusicIcon, SpotifyIcon } from '../Icons/Icons';
import styles from './SourceIndicator.module.css';

interface SourceIndicatorProps {
  source?: MusicSource;
  size?: 'small' | 'large';
  url?: string;
  onClick?: () => void;
}

/**
 * SourceIndicator displays a cute, minimal badge indicating the music platform source
 * Positioned as an overlay on album artwork
 * Defaults to Apple Music if no source is specified (original data source)
 */
export const SourceIndicator = memo(({ source, size = 'small', url, onClick }: SourceIndicatorProps) => {
  // Default to Apple Music if no source is provided (original data source)
  // Only hide indicator if explicitly set to 'unknown'
  const actualSource: MusicSource = source && source !== 'unknown' ? source : 'apple';

  const displayName = getMusicSourceDisplayName(actualSource);
  const sizeClass = size === 'large' ? styles.large : styles.small;

  const handleClick = () => {
    if (url && onClick) {
      onClick();
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`${styles.indicator} ${sizeClass} ${styles[actualSource]}`}
      title={url ? `Click to open in ${displayName}` : displayName}
      aria-label={`Source: ${displayName}`}
      onClick={handleClick}
      style={{
        cursor: url ? 'pointer' : 'default',
        pointerEvents: url ? 'auto' : 'none'
      }}
    >
      {actualSource === 'apple' && <AppleMusicIcon />}
      {actualSource === 'spotify' && <SpotifyIcon />}
    </div>
  );
});

SourceIndicator.displayName = 'SourceIndicator';
