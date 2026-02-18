import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import SongItem from "../components/SongItem";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";

// Mock the image processing utility
vi.mock("../../../utils/imageProcessing", () => ({
  getProcessedArtworkUrl: vi.fn((url) => `processed-${url}`),
}));

describe("SongItem Component", () => {
  const mockSong = createMockMusicItem({
    id: "123",
    name: "Test Song Name",
    artistName: "Test Artist",
    albumName: "Test Album",
    artworkUrl: "https://example.com/artwork.jpg",
    playedAt: new Date().toISOString(),
  });

  const mockSongWithLongNames = createMockMusicItem({
    id: "456",
    name: "The Secret Garden (Sweet Seduction Suite) [feat. Barry White, Al B. Surel, James Ingram & El DeBarge]",
    artistName: "Quincy Jones",
    albumName: "Back on the Block (Deluxe Edition)",
    artworkUrl: "https://example.com/artwork-long.jpg",
    playedAt: new Date().toISOString(),
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders song information correctly", () => {
    render(<SongItem song={mockSong} index={0} rowName="test-row" />);

    // Check that correct song info is displayed
    expect(screen.getByText("Test Song Name")).toBeDefined();
    expect(screen.getByText("Test Artist - Test Album")).toBeDefined();

    // Check image properties
    const image = screen.getByAltText("Test Song Name Album Cover");
    expect(image.getAttribute("src")).toBe("processed-https://example.com/artwork.jpg");
    expect(image.getAttribute("title")).toBe(
      "Click to open Test Song Name in Apple Music",
    );
  });

  it("handles long song and artist names correctly", () => {
    render(
      <SongItem song={mockSongWithLongNames} index={0} rowName="test-row" />,
    );

    // Check that long names are displayed and properly handled with truncation in CSS
    const songName = screen.getByText(
      "The Secret Garden (Sweet Seduction Suite) [feat. Barry White, Al B. Surel, James Ingram & El DeBarge]",
    );
    expect(songName).toBeDefined();

    // Check that the element has title attribute for hover text
    expect(songName.getAttribute("title")).toBe(
      "The Secret Garden (Sweet Seduction Suite) [feat. Barry White, Al B. Surel, James Ingram & El DeBarge]",
    );

    // Check artist and album info
    const artistAlbum = screen.getByText(
      "Quincy Jones - Back on the Block (Deluxe Edition)",
    );
    expect(artistAlbum).toBeDefined();
    expect(artistAlbum.getAttribute("title")).toBe(
      "Quincy Jones - Back on the Block (Deluxe Edition)",
    );
  });
});
