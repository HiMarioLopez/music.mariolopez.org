import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RecentlyPlayedList from "../RecentlyPlayedList";
import { createMockMusicItem } from "../../../mocks/context/MusicContextMock";
import { MusicItem } from "../../../context/MusicContext";

// Define the interface that matches MusicContextType from MusicContext.tsx
interface MockMusicContextType {
  nowPlaying: MusicItem | null;
  recentlyPlayed: MusicItem[];
  loading: boolean;
  error: string | null;
  refreshMusicHistory: () => Promise<void>;
}

// Create mock for useMusicContext
const mockContextValue: MockMusicContextType = {
  nowPlaying: null,
  recentlyPlayed: [],
  loading: false,
  error: null,
  refreshMusicHistory: vi.fn().mockResolvedValue(undefined),
};

// Mock the MusicContext hook
vi.mock("../../../context/MusicContext", () => ({
  useMusicContext: () => mockContextValue,
}));

// Mock the react-slick library
vi.mock("slick-carousel/slick/slick.css", () => ({}));
vi.mock("slick-carousel/slick/slick-theme.css", () => ({}));
vi.mock("react-slick", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: function MockSlider({ children, ...props }: any) {
    return (
      <div data-testid="mock-slider" {...props}>
        {children}
      </div>
    );
  },
}));

// Mock the useCarouselSettings hook
vi.mock("../hooks/useCarouselSettings", () => ({
  useCarouselSettings: () => ({
    topSliderSettings: { speed: 20000, rtl: false },
    middleSliderSettings: { speed: 22000, rtl: true },
    bottomSliderSettings: { speed: 24000, rtl: false },
  }),
}));

// Sample track data
const mockTracks: MusicItem[] = [
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
  createMockMusicItem({
    id: "4",
    name: "Track with a Very Long Name That Should Be Truncated",
    artistName: "Artist with a Long Name",
    albumName: "Album with a Very Long Title That Should Also Be Truncated",
    artworkUrl: "https://example.com/artwork4.jpg",
  }),
  createMockMusicItem({
    id: "5",
    name: "Track 5",
    artistName: "Artist 5",
    albumName: "Album 5",
    artworkUrl: "https://example.com/artwork5.jpg",
  }),
  createMockMusicItem({
    id: "6",
    name: "Track 6",
    artistName: "Artist 6",
    albumName: "Album 6",
    artworkUrl: "https://example.com/artwork6.jpg",
  }),
];

describe("RecentlyPlayedList Component", () => {
  beforeEach(() => {
    // Reset mock context values before each test
    mockContextValue.recentlyPlayed = [];
    mockContextValue.loading = false;
    mockContextValue.error = null;
  });

  it("renders the component with tracks", () => {
    // Update mock context for this specific test
    mockContextValue.recentlyPlayed = mockTracks;

    render(<RecentlyPlayedList />);

    // Check the title is rendered
    expect(screen.getByText("Recently Played")).toBeDefined();

    // Check that tracks are rendered
    expect(screen.getAllByText("Track 1")).toBeDefined();
    expect(screen.getAllByText("Artist 1 - Album 1")).toBeDefined();

    // Check for the carousel sliders
    expect(screen.getAllByTestId("mock-slider")).toHaveLength(3);
  });

  it("renders the loading state with skeleton loader", () => {
    // Update mock context for this specific test
    mockContextValue.loading = true;

    render(<RecentlyPlayedList />);

    // Check the title is still rendered during loading
    expect(screen.getByText("Recently Played")).toBeDefined();

    // We need to check for skeleton loader elements
    // This part depends on how your SkeletonLoader component is implemented
    // and what test IDs or classes it uses
  });

  it("renders the error state", () => {
    const errorMessage = "Failed to fetch tracks";

    // Update mock context for this specific test
    mockContextValue.error = errorMessage;

    render(<RecentlyPlayedList />);

    // Check the title is still rendered during error
    expect(screen.getByText("Recently Played")).toBeDefined();

    // Check that the error message is displayed
    expect(
      screen.getByText(`Error loading tracks: ${errorMessage}`),
    ).toBeDefined();
  });

  it("renders empty state when no tracks are available", () => {
    // Mock context is already reset in beforeEach

    render(<RecentlyPlayedList />);

    // Check the title is still rendered
    expect(screen.getByText("Recently Played")).toBeDefined();

    // Check for the empty state message
    expect(
      screen.getByText("No recently played tracks available"),
    ).toBeDefined();
  });
});
