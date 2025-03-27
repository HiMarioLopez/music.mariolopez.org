import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CarouselRow from "../components/CarouselRow";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";

// Mock TrackItem component to simplify testing
vi.mock("../components/TrackItem", () => ({
  __esModule: true,
  default: vi.fn(({ track, index, rowName }) => {
    return (
      <div data-testid={`track-item-${rowName}-${index}`}>
        <div>{track.name}</div>
        <div>
          {track.artistName} - {track.albumName}
        </div>
      </div>
    );
  }),
}));

// Mock the react-slick library
vi.mock("react-slick", () => ({
  __esModule: true,
  default: vi.fn(({ children, ...props }) => {
    return (
      <div data-testid="mock-slider" data-settings={JSON.stringify(props)}>
        {children}
      </div>
    );
  }),
}));

describe("CarouselRow Component", () => {
  const mockTracks = [
    createMockMusicItem({
      id: "1",
      name: "Track 1",
      artistName: "Artist 1",
      albumName: "Album 1",
      artworkUrl: "https://example.com/artwork1.jpg",
    }),
    createMockMusicItem({
      id: "2",
      name: "Track 2",
      artistName: "Artist 2",
      albumName: "Album 2",
      artworkUrl: "https://example.com/artwork2.jpg",
    }),
    createMockMusicItem({
      id: "3",
      name: "Track 3",
      artistName: "Artist 3",
      albumName: "Album 3",
      artworkUrl: "https://example.com/artwork3.jpg",
    }),
  ];

  const sliderSettings = {
    speed: 20000,
    rtl: false,
    dots: false,
    arrows: false,
    infinite: true,
    autoplay: true,
  };

  it("renders the carousel with correct tracks", () => {
    render(
      <CarouselRow
        tracks={mockTracks}
        settings={sliderSettings}
        rowName="top"
      />,
    );

    // Check that the slider container is rendered
    const slider = screen.getByTestId("mock-slider");
    expect(slider).toBeDefined();

    // Check that all tracks are rendered
    mockTracks.forEach((_, index) => {
      const trackItem = screen.getByTestId(`track-item-top-${index}`);
      expect(trackItem).toBeDefined();
    });

    // Check that the slider settings are passed correctly
    const sliderProps = JSON.parse(
      slider.getAttribute("data-settings") || "{}",
    );
    expect(sliderProps.speed).toBe(20000);
    expect(sliderProps.rtl).toBe(false);
  });

  it("renders empty carousel when no tracks are provided", () => {
    render(<CarouselRow tracks={[]} settings={sliderSettings} rowName="top" />);

    // Slider should still be rendered
    const slider = screen.getByTestId("mock-slider");
    expect(slider).toBeDefined();

    // But no track items should be rendered
    expect(screen.queryByTestId(/track-item/)).toBeNull();
  });

  it("passes unique keys to each track item", () => {
    render(
      <CarouselRow
        tracks={mockTracks}
        settings={sliderSettings}
        rowName="top"
      />,
    );

    // Check that each track has a different test ID (which represents our key strategy)
    const trackItems = screen.getAllByTestId(/track-item-top-\d/);
    expect(trackItems).toHaveLength(mockTracks.length);

    // Ensure all test IDs are unique
    const trackItemIds = trackItems.map((item) =>
      item.getAttribute("data-testid"),
    );
    const uniqueIds = new Set(trackItemIds);
    expect(uniqueIds.size).toBe(mockTracks.length);
  });
});
