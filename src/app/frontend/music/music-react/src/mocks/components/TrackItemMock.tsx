import { vi } from 'vitest';

// Mock for the TrackItem component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockTrackItem = vi.fn(({ track, index, rowName }: any) => {
  return (
    <div data-testid={`track-item-${rowName}-${index}`}>
      <div>{track.name}</div>
      <div>
        {track.artistName} - {track.albumName}
      </div>
    </div>
  );
});

export default MockTrackItem;
