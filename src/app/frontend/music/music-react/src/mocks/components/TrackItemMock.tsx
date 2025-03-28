import { vi } from "vitest";

// Mock for the SongItem component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockSongItem = vi.fn(({ song, index, rowName }: any) => {
  return (
    <div data-testid={`song-item-${rowName}-${index}`}>
      <div>{song.name}</div>
      <div>
        {song.artistName} - {song.albumName}
      </div>
    </div>
  );
});

export default MockSongItem;
