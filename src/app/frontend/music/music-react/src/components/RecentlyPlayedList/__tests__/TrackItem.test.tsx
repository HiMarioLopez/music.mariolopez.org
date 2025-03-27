import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import TrackItem from "../components/TrackItem";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";

// Mock the image processing utility
vi.mock("../../../utils/imageProcessing", () => ({
  getProcessedArtworkUrl: vi.fn((url) => `processed-${url}`),
}));

describe("TrackItem Component", () => {
  const mockTrack = createMockMusicItem({
    id: "123",
    name: "Test Track Name",
    artistName: "Test Artist",
    albumName: "Test Album",
    artworkUrl: "https://example.com/artwork.jpg",
    playedAt: new Date().toISOString(),
  });

  const mockTrackWithLongNames = createMockMusicItem({
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

  it("renders track information correctly", () => {
    render(<TrackItem track={mockTrack} index={0} rowName="test-row" />);

    // Check that correct track info is displayed
    expect(screen.getByText("Test Track Name")).toBeDefined();
    expect(screen.getByText("Test Artist - Test Album")).toBeDefined();

    // Check image properties
    const image = screen.getByAltText("Test Track Name Album Cover");
    expect(image).toHaveAttribute(
      "src",
      "processed-https://example.com/artwork.jpg",
    );
    expect(image).toHaveAttribute("title", "Test Track Name by Test Artist");
  });

  it("handles long track and artist names correctly", () => {
    render(
      <TrackItem track={mockTrackWithLongNames} index={0} rowName="test-row" />,
    );

    // Check that long names are displayed and properly handled with truncation in CSS
    const trackName = screen.getByText(
      "The Secret Garden (Sweet Seduction Suite) [feat. Barry White, Al B. Surel, James Ingram & El DeBarge]",
    );
    expect(trackName).toBeDefined();

    // Check that the element has title attribute for hover text
    expect(trackName).toHaveAttribute(
      "title",
      "The Secret Garden (Sweet Seduction Suite) [feat. Barry White, Al B. Surel, James Ingram & El DeBarge]",
    );

    // Check artist and album info
    const artistAlbum = screen.getByText(
      "Quincy Jones - Back on the Block (Deluxe Edition)",
    );
    expect(artistAlbum).toBeDefined();
    expect(artistAlbum).toHaveAttribute(
      "title",
      "Quincy Jones - Back on the Block (Deluxe Edition)",
    );
  });
});
