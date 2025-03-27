import { useMemo } from "react";

/**
 * Hook to provide consistent carousel settings across the application
 */
export const useCarouselSettings = () => {
  // Using useMemo to prevent recreating these objects on every render
  return useMemo(() => {
    // Base settings that apply to all carousels
    const baseSettings = {
      dots: false,
      arrows: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 0,
      cssEase: "linear",
      pauseOnHover: true,
      variableWidth: true,
      swipeToSlide: true,
    };

    // React Slick carousel settings for top row - moves left to right
    const topSliderSettings = {
      ...baseSettings,
      speed: 20000,
      rtl: false, // Right to left is false - moves left to right
    };

    // React Slick carousel settings for middle row - moves right to left
    const middleSliderSettings = {
      ...baseSettings,
      speed: 22000, // Slightly different speed for visual interest
      rtl: true, // Right to left is true - moves right to left
    };

    // React Slick carousel settings for bottom row - moves left to right but slower
    const bottomSliderSettings = {
      ...baseSettings,
      speed: 24000, // Even slower speed for bottom row
      rtl: false, // Right to left is false - moves left to right
    };

    return {
      topSliderSettings,
      middleSliderSettings,
      bottomSliderSettings,
    };
  }, []); // Empty dependency array since these settings never change
};
