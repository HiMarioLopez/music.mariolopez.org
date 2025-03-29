import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../../../services/apiService";
import RecommendationForm from "../RecommendationForm";
import { mockApiResponse } from "./RecommendationForm.mock";

// Mock the API service
vi.mock("../../../services/apiService", () => ({
  apiService: {
    searchSuggestions: vi.fn(),
  },
  authService: {
    getTokenWithCache: vi.fn().mockResolvedValue("mock-token"),
    clearToken: vi.fn(),
  },
  ApiError: class MockApiError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

// Mock the context
const mockAddRecommendation = vi.fn();
vi.mock("../../../context/RecommendationsContext", () => ({
  RecommendationsProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useRecommendations: () => ({
    addRecommendation: mockAddRecommendation,
    state: {
      songs: { items: [], loading: false, error: null, loaded: false },
      albums: { items: [], loading: false, error: null, loaded: false },
      artists: { items: [], loading: false, error: null, loaded: false },
    },
  }),
}));

describe("RecommendationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock implementation
    (apiService.searchSuggestions as any).mockResolvedValue(mockApiResponse);
  });

  it("renders the component correctly", async () => {
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for component to fully render
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /make a recommendation/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls the API when user types in search box", async () => {
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for authentication to complete
    await waitFor(() => {
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
    });

    const searchInput = screen.getByRole("textbox");

    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for the search call
    await waitFor(() => {
      expect(apiService.searchSuggestions).toHaveBeenCalledWith("bohemian", 3);
    });
  });

  it("displays search results when API returns data", async () => {
    // Wrap render in act
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for authentication to complete first
    await waitFor(() => {
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
    });

    const searchInput = screen.getByRole("textbox");

    // Wrap user interaction in act
    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Use a more generous timeout and check for actual elements that appear
    await waitFor(
      () => {
        // Look for any of the search results instead of section headers
        expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Check if other results are displayed - use regex for partial matches
    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
    // Use regex to match "Queen" within the "by Queen" text
    expect(screen.getByText(/Queen/)).toBeInTheDocument();
  });

  it("calls addRecommendation when a song is selected", async () => {
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for authentication to complete first
    await waitFor(() => {
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
    });

    const searchInput = screen.getByRole("textbox");

    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for results to appear
    await waitFor(
      () => {
        // Use a case-sensitive regex to match only the song title with capital B
        expect(screen.getByText(/Bohemian Rhapsody/)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Bohemian Rhapsody"));
    });

    // Check if addRecommendation was called with the correct song
    expect(mockAddRecommendation).toHaveBeenCalledWith(
      "songs",
      expect.objectContaining({
        songTitle: "Bohemian Rhapsody",
        artistName: expect.any(String),
        albumName: expect.any(String),
        albumCoverUrl: expect.any(String),
      }),
    );
  });

  it("updates search when hint is selected", async () => {
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for authentication to complete first
    await waitFor(() => {
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
    });

    const searchInput = screen.getByRole("textbox");

    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for results to appear using a more flexible matcher and increased timeout
    await waitFor(
      () => {
        // Look for any of the search results instead of section headers
        expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Click on a hint using the same flexible matcher
    await act(async () => {
      fireEvent.click(screen.getByText("bohemian rhapsody"));
    });

    // Check if the search term was updated
    expect(searchInput).toHaveValue("bohemian rhapsody");

    // Verify API was called with new search term
    await waitFor(() => {
      expect(apiService.searchSuggestions).toHaveBeenCalledWith(
        "bohemian rhapsody",
        3,
      );
    });
  });

  it("handles keyboard navigation correctly", async () => {
    // Mock scrollIntoView which is not implemented in JSDOM
    Element.prototype.scrollIntoView = vi.fn();

    // Wrap render in act
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for authentication to complete first
    await waitFor(() => {
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
    });

    const searchInput = screen.getByRole("textbox");

    // Wrap user interaction in act
    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for results to appear
    await waitFor(
      () => {
        // Look for any hint result
        expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Press down arrow to navigate to first result
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    });

    // First hint should be highlighted
    await waitFor(() => {
      const firstHint = screen.getByText("bohemian rhapsody").closest("li");
      expect(firstHint).toHaveAttribute("aria-selected", "true");
    });

    // Press down arrow again to navigate to second result
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    });

    // Check second result is selected
    await waitFor(() => {
      const firstHint = screen.getByText("bohemian rhapsody").closest("li");
      expect(firstHint).toHaveAttribute("aria-selected", "false");
      // Assuming there's a second hint, we'd check it here
    });

    // Test Home key - should go back to first item
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "Home" });
    });

    // First hint should be highlighted again
    await waitFor(() => {
      const firstHint = screen.getByText("bohemian rhapsody").closest("li");
      expect(firstHint).toHaveAttribute("aria-selected", "true");
    });

    // Test End key - should go to last item
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "End" });
    });

    // Last item should be highlighted (this might be a "Show more" button or the last result)
    await waitFor(() => {
      const firstHint = screen.getByText("bohemian rhapsody").closest("li");
      expect(firstHint).toHaveAttribute("aria-selected", "false");
      // We'd check the last visible result or "Show more" button here
    });

    // Go back to first item with Home key
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "Home" });
    });

    // Press Enter to select the hint
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "Enter" });
    });

    // Check if the search term was updated
    await waitFor(
      () => {
        expect(searchInput).toHaveValue("bohemian rhapsody");
      },
      { timeout: 1000 },
    );
  });

  it("handles Escape key correctly", async () => {
    // Mock scrollIntoView which is not implemented in JSDOM
    Element.prototype.scrollIntoView = vi.fn();

    // Wrap render in act
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for authentication to complete
    await waitFor(() => {
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
    });

    const searchInput = screen.getByRole("textbox");

    // Type in search query
    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for results to appear
    await waitFor(
      () => {
        expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Search results should be visible
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "Escape" });
    });

    // Results should no longer be visible
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("maintains focus during authentication and search operations", async () => {
    const { authService } = await import("../../../services/apiService");

    // Create a more aggressive delay to force potential focus issues
    (authService.getTokenWithCache as any).mockImplementation(async () => {
      // Longer delay to simulate authentication process
      await new Promise((resolve) => setTimeout(resolve, 200));
      return "mock-token";
    });

    // Create custom search implementation with delay
    (apiService.searchSuggestions as any).mockImplementation(async () => {
      // Longer delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockApiResponse;
    });

    // We can't mock focus directly, so we'll use a spy to track when active element changes
    const focusTracker = vi.fn();
    const originalAddEventListener = document.addEventListener;

    // Track focus changes by monitoring focusin event
    document.addEventListener = function (
      type: string,
      listener: EventListener,
      ...rest: any[]
    ) {
      if (type === "focusin") {
        const wrappedListener = (e: Event) => {
          focusTracker(e.target);
          return (listener as EventListener)(e);
        };
        return originalAddEventListener.call(
          this,
          type,
          wrappedListener,
          ...rest,
        );
      }
      return originalAddEventListener.call(this, type, listener, ...rest);
    };

    await act(async () => {
      render(<RecommendationForm />);
    });

    // Get the search input and focus it
    const searchInput = screen.getByRole("textbox");
    await act(async () => {
      searchInput.focus();
    });

    // Verify input has focus initially
    expect(document.activeElement).toBe(searchInput);

    // Type to trigger search and authentication
    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for search results to appear
    await waitFor(
      () => {
        expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Verify focus is maintained on the input after search completes
    expect(document.activeElement).toBe(searchInput);

    // Make another search to test focus during regular search
    await act(async () => {
      // Clear and type new search
      fireEvent.change(searchInput, { target: { value: "" } });
      await userEvent.type(searchInput, "queen");
    });

    // Verify focus is still maintained
    expect(document.activeElement).toBe(searchInput);

    // Test focus retention with keyboard navigation
    await act(async () => {
      // Press down to navigate to results
      fireEvent.keyDown(searchInput, { key: "ArrowDown" });
      // Press escape to dismiss results
      fireEvent.keyDown(searchInput, { key: "Escape" });
    });

    // Input should still have focus after keyboard navigation
    expect(document.activeElement).toBe(searchInput);

    // Restore original method
    document.addEventListener = originalAddEventListener;
  });

  it("only authenticates when user performs a search", async () => {
    const { authService } = await import("../../../services/apiService");

    // Render component
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Check that auth was not called on mount
    expect(authService.getTokenWithCache).not.toHaveBeenCalled();

    // Type in the search box
    const searchInput = screen.getByRole("textbox");
    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for the search and verify auth was called
    await waitFor(() => {
      expect(authService.getTokenWithCache).toHaveBeenCalledTimes(1);
      expect(apiService.searchSuggestions).toHaveBeenCalledWith("bohemian", 3);
    });
  });

  it("clears search when the clear button is clicked", async () => {
    await act(async () => {
      render(<RecommendationForm />);
    });

    // Type in the search box
    const searchInput = screen.getByRole("textbox");
    await userEvent.type(searchInput, "bohemian");

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
    });

    // Click the clear button
    const clearButton = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(clearButton);

    // Check if the search was cleared
    expect(searchInput).toHaveValue("");

    // Check if results were removed
    expect(screen.queryByText("bohemian rhapsody")).not.toBeInTheDocument();
  });

  it("cycles through results with keyboard navigation", async () => {
    // Mock scrollIntoView which is not implemented in JSDOM
    Element.prototype.scrollIntoView = vi.fn();

    await act(async () => {
      render(<RecommendationForm />);
    });

    // Wait for component to be ready
    const searchInput = screen.getByRole("textbox");
    await waitFor(() => {
      expect(searchInput).not.toBeDisabled();
    });

    // Type to get results
    await act(async () => {
      await userEvent.type(searchInput, "bohemian");
    });

    // Wait for results
    await waitFor(
      () => {
        expect(screen.getByText("bohemian rhapsody")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Get the total number of results (depends on the visible results)
    const resultsList = screen.getByRole("listbox");
    const totalResults = resultsList.querySelectorAll("li").length;

    // Go to the last result using End key
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "End" });
    });

    // Press Down arrow to verify cycling to top
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    });

    // First result should now be active
    await waitFor(() => {
      const firstResult = resultsList.querySelector('li[data-index="0"]');
      expect(firstResult).toHaveAttribute("aria-selected", "true");
    });

    // Press Up arrow when at top to cycle to bottom
    await act(async () => {
      // First make sure we're at the top
      fireEvent.keyDown(searchInput, { key: "Home" });
      // Then press up to cycle to bottom
      fireEvent.keyDown(searchInput, { key: "ArrowUp" });
    });

    // Last result should now be active
    await waitFor(() => {
      const lastResult = resultsList.querySelector(
        `li[data-index="${totalResults - 1}"]`,
      );
      expect(lastResult).toHaveAttribute("aria-selected", "true");
    });
  });
});
