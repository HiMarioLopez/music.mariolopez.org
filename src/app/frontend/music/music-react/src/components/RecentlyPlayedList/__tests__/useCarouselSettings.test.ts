import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCarouselSettings } from "../hooks/useCarouselSettings";

describe("useCarouselSettings Hook", () => {
  it("returns the correct carousel settings", () => {
    const { result } = renderHook(() => useCarouselSettings());

    // Check that the hook returns the expected settings objects
    expect(result.current).toHaveProperty("topSliderSettings");
    expect(result.current).toHaveProperty("middleSliderSettings");
    expect(result.current).toHaveProperty("bottomSliderSettings");

    // Verify top slider settings
    expect(result.current.topSliderSettings).toMatchObject({
      speed: 100000,
      direction: "left",
    });

    // Verify middle slider settings (reverse direction)
    expect(result.current.middleSliderSettings).toMatchObject({
      speed: 100000,
      direction: "right",
    });

    // Verify bottom slider settings
    expect(result.current.bottomSliderSettings).toMatchObject({
      speed: 100000,
      direction: "left",
    });
  });

  it("returns memoized values that do not change on rerenders", () => {
    const { result, rerender } = renderHook(() => useCarouselSettings());

    // Save references to the initial settings
    const initialTopSettings = result.current.topSliderSettings;
    const initialMiddleSettings = result.current.middleSliderSettings;
    const initialBottomSettings = result.current.bottomSliderSettings;

    // Force a rerender
    rerender();

    // Settings should be referentially equal (same object references)
    expect(result.current.topSliderSettings).toBe(initialTopSettings);
    expect(result.current.middleSliderSettings).toBe(initialMiddleSettings);
    expect(result.current.bottomSliderSettings).toBe(initialBottomSettings);
  });
});
