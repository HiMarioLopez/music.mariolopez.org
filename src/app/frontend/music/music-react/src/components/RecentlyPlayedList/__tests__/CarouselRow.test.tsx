import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CarouselRow from "../components/CarouselRow";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";

// Mock SongItem component to simplify testing
vi.mock("../components/SongItem", () => ({
  __esModule: true,
  default: vi.fn(({ song, index, rowName }) => {
    return (
      <div data-testid={`song-item-${rowName}-${index}`}>
        <div>{song.name}</div>
        <div>
          {song.artistName} - {song.albumName}
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
  const mockSongs = [
    createMockMusicItem({
      id: "1",
      name: "Song 1",
      artistName: "Artist 1",
      albumName: "Album 1",
      artworkUrl: "https://example.com/artwork1.jpg",
    }),
    createMockMusicItem({
      id: "2",
      name: "Song 2",
      artistName: "Artist 2",
      albumName: "Album 2",
      artworkUrl: "https://example.com/artwork2.jpg",
    }),
    createMockMusicItem({
      id: "3",
      name: "Song 3",
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

  it("renders the carousel with correct songs", () => {
    render(
      <CarouselRow songs={mockSongs} settings={sliderSettings} rowName="top" />,
    );

    // Check that the slider container is rendered
    const slider = screen.getByTestId("mock-slider");
    expect(slider).toBeDefined();

    // Check that all songs are rendered
    mockSongs.forEach((_, index) => {
      const songItem = screen.getByTestId(`song-item-top-${index}`);
      expect(songItem).toBeDefined();
    });

    // Check that the slider settings are passed correctly
    const sliderProps = JSON.parse(
      slider.getAttribute("data-settings") || "{}",
    );
    expect(sliderProps.speed).toBe(20000);
    expect(sliderProps.rtl).toBe(false);
  });

  it("renders empty carousel when no songs are provided", () => {
    render(<CarouselRow songs={[]} settings={sliderSettings} rowName="top" />);

    // Slider should still be rendered
    const slider = screen.getByTestId("mock-slider");
    expect(slider).toBeDefined();

    // But no song items should be rendered
    expect(screen.queryByTestId(/song-item/)).toBeNull();
  });

  it("passes unique keys to each song item", () => {
    render(
      <CarouselRow songs={mockSongs} settings={sliderSettings} rowName="top" />,
    );

    // Check that each song has a different test ID (which represents our key strategy)
    const songItems = screen.getAllByTestId(/song-item-top-\d/);
    expect(songItems).toHaveLength(mockSongs.length);

    // Ensure all test IDs are unique
    const songItemIds = songItems.map((item) =>
      item.getAttribute("data-testid"),
    );
    const uniqueIds = new Set(songItemIds);
    expect(uniqueIds.size).toBe(mockSongs.length);
  });
});
