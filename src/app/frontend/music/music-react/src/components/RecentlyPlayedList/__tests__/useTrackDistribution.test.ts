import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTrackDistribution } from "../hooks/useTrackDistribution";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";
import { MusicItem } from "../../../context/MusicContext";

describe("useTrackDistribution Hook", () => {
  // Create sample track data
  const generateTracks = (count: number): MusicItem[] => {
    return Array.from({ length: count }, (_, i) =>
      createMockMusicItem({
        id: `track-${i + 1}`,
        name: `Track ${i + 1}`,
        artistName: `Artist ${i + 1}`,
        albumName: `Album ${i + 1}`,
        artworkUrl: `https://example.com/artwork${i + 1}.jpg`,
      }),
    );
  };

  it("distributes tracks across three rows correctly", () => {
    // Create 9 tracks to distribute evenly across 3 rows
    const mockTracks = generateTracks(30);

    const { result } = renderHook(() => useTrackDistribution(mockTracks));

    // Each row should have 3 tracks
    expect(result.current.topRowTracks).toHaveLength(10);
    expect(result.current.middleRowTracks).toHaveLength(10);
    expect(result.current.bottomRowTracks).toHaveLength(10);

    // Verify the distribution order
    expect(result.current.topRowTracks[0].id).toBe("track-1");
    expect(result.current.middleRowTracks[0].id).toBe("track-11");
    expect(result.current.bottomRowTracks[0].id).toBe("track-21");
  });

  it("handles fewer than desired tracks by duplicating", () => {
    // Create only 3 tracks
    const mockTracks = generateTracks(3);

    const { result } = renderHook(() => useTrackDistribution(mockTracks));

    // Should still have tracks in all rows, but will duplicate them
    expect(result.current.topRowTracks).toHaveLength(3);
    expect(result.current.middleRowTracks).toHaveLength(3);
    expect(result.current.bottomRowTracks).toHaveLength(3);

    // Should have duplicated the tracks
    expect(result.current.topRowTracks.map((t: MusicItem) => t.id)).toEqual([
      "track-1",
      "track-2",
      "track-3",
    ]);
    expect(result.current.middleRowTracks.map((t: MusicItem) => t.id)).toEqual([
      "track-1",
      "track-2",
      "track-3",
    ]);
    expect(result.current.bottomRowTracks.map((t: MusicItem) => t.id)).toEqual([
      "track-1",
      "track-2",
      "track-3",
    ]);
  });

  it("handles uneven distribution correctly", () => {
    // Create 10 tracks (not divisible by 3 perfectly)
    const mockTracks = generateTracks(10);

    const { result } = renderHook(() => useTrackDistribution(mockTracks));

    // Should have distributed as evenly as possible
    // 10 / 3 = 3.33, so first row gets 4, second gets 4, third gets 2
    expect(result.current.topRowTracks).toHaveLength(4);
    expect(result.current.middleRowTracks).toHaveLength(4);
    expect(result.current.bottomRowTracks).toHaveLength(2);
  });

  it("handles empty track list gracefully", () => {
    const { result } = renderHook(() => useTrackDistribution([]));

    // Should have empty arrays for all rows
    expect(result.current.topRowTracks).toHaveLength(0);
    expect(result.current.middleRowTracks).toHaveLength(0);
    expect(result.current.bottomRowTracks).toHaveLength(0);
  });

  it("returns memoized values that do not change if tracks do not change", () => {
    const mockTracks = generateTracks(6);

    const { result, rerender } = renderHook(() =>
      useTrackDistribution(mockTracks),
    );

    // Save references to initial values
    const initialTopTracks = result.current.topRowTracks;
    const initialMiddleTracks = result.current.middleRowTracks;
    const initialBottomTracks = result.current.bottomRowTracks;

    // Rerender with the same tracks
    rerender();

    // Values should be referentially equal (same array references)
    expect(result.current.topRowTracks).toBe(initialTopTracks);
    expect(result.current.middleRowTracks).toBe(initialMiddleTracks);
    expect(result.current.bottomRowTracks).toBe(initialBottomTracks);
  });
});
