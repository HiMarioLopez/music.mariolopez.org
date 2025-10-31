import { useMemo } from "react";

/**
 * Hook to provide consistent carousel settings across the application
 */
export const useCarouselSettings = () => {
  // Using useMemo to prevent recreating these objects on every render
  return useMemo(() => {
    // Normalized speed - all carousels move at the same speed
    // Duration in ms for one complete cycle (3x slower than before)
    const normalizedSpeed = 100000; // 100 seconds per cycle

    // Carousel settings for top row - moves left to right
    const topSliderSettings = {
      speed: normalizedSpeed,
      direction: "left" as const, // Moves left to right (content moves left)
    };

    // Carousel settings for middle row - moves right to left
    const middleSliderSettings = {
      speed: normalizedSpeed,
      direction: "right" as const, // Moves right to left (content moves right)
    };

    // Carousel settings for bottom row - moves left to right
    const bottomSliderSettings = {
      speed: normalizedSpeed,
      direction: "left" as const, // Moves left to right (content moves left)
    };

    return {
      topSliderSettings,
      middleSliderSettings,
      bottomSliderSettings,
    };
  }, []); // Empty dependency array since these settings never change
};
