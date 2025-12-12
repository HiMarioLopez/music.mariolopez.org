import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSongDistribution } from "../hooks/useSongDistribution";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";
import { AppleMusicSong } from "../../../models/AppleMusicSong";

describe("useSongDistribution Hook", () => {
  // Create sample song data
  const generateSongs = (count: number): AppleMusicSong[] => {
    return Array.from({ length: count }, (_, i) =>
      createMockMusicItem({
        id: `song-${i + 1}`,
        name: `Song ${i + 1}`,
        artistName: `Artist ${i + 1}`,
        albumName: `Album ${i + 1}`,
        artworkUrl: `https://example.com/artwork${i + 1}.jpg`,
      }),
    );
  };

  it("distributes songs across three rows correctly", () => {
    // Create 9 songs to distribute evenly across 3 rows
    const mockSongs = generateSongs(30);

    const { result } = renderHook(() => useSongDistribution(mockSongs));

    // Each row should have 3 songs
    expect(result.current.topRowSongs).toHaveLength(10);
    expect(result.current.middleRowSongs).toHaveLength(10);
    expect(result.current.bottomRowSongs).toHaveLength(10);

    // Verify the distribution order
    expect(result.current.topRowSongs[0].id).toBe("song-1");
    expect(result.current.middleRowSongs[0].id).toBe("song-11");
    expect(result.current.bottomRowSongs[0].id).toBe("song-21");
  });

  it("handles fewer than desired songs by duplicating", () => {
    // Create only 3 songs
    const mockSongs = generateSongs(3);

    const { result } = renderHook(() => useSongDistribution(mockSongs));

    // Should still have songs in all rows, but will duplicate them
    expect(result.current.topRowSongs).toHaveLength(3);
    expect(result.current.middleRowSongs).toHaveLength(3);
    expect(result.current.bottomRowSongs).toHaveLength(3);

    // Should have duplicated the songs
    expect(result.current.topRowSongs.map((t: AppleMusicSong) => t.id)).toEqual(
      ["song-1", "song-2", "song-3"],
    );
    expect(
      result.current.middleRowSongs.map((t: AppleMusicSong) => t.id),
    ).toEqual(["song-1", "song-2", "song-3"]);
    expect(
      result.current.bottomRowSongs.map((t: AppleMusicSong) => t.id),
    ).toEqual(["song-1", "song-2", "song-3"]);
  });

  it("handles uneven distribution correctly", () => {
    // Create 10 songs (not divisible by 3 perfectly)
    const mockSongs = generateSongs(10);

    const { result } = renderHook(() => useSongDistribution(mockSongs));

    // Should have distributed as evenly as possible
    // 10 / 3 = 3.33, so first row gets 4, second gets 4, third gets 2
    expect(result.current.topRowSongs).toHaveLength(4);
    expect(result.current.middleRowSongs).toHaveLength(4);
    expect(result.current.bottomRowSongs).toHaveLength(2);
  });

  it("handles empty song list gracefully", () => {
    const { result } = renderHook(() => useSongDistribution([]));

    // Should have empty arrays for all rows
    expect(result.current.topRowSongs).toHaveLength(0);
    expect(result.current.middleRowSongs).toHaveLength(0);
    expect(result.current.bottomRowSongs).toHaveLength(0);
  });

  it("returns memoized values that do not change if songs do not change", () => {
    const mockSongs = generateSongs(6);

    const { result, rerender } = renderHook(() =>
      useSongDistribution(mockSongs),
    );

    // Save references to initial values
    const initialTopSongs = result.current.topRowSongs;
    const initialMiddleSongs = result.current.middleRowSongs;
    const initialBottomSongs = result.current.bottomRowSongs;

    // Rerender with the same songs
    rerender();

    // Values should be referentially equal (same array references)
    expect(result.current.topRowSongs).toBe(initialTopSongs);
    expect(result.current.middleRowSongs).toBe(initialMiddleSongs);
    expect(result.current.bottomRowSongs).toBe(initialBottomSongs);
  });
});
