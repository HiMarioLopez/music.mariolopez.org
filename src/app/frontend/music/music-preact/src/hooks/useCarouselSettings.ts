import { useMemo } from "preact/hooks";

export interface CarouselSettings {
  speed: number;
  direction: "left" | "right";
}

export interface CarouselSettingsGroup {
  topSliderSettings: CarouselSettings;
  middleSliderSettings: CarouselSettings;
  bottomSliderSettings: CarouselSettings;
}

export const useCarouselSettings = (): CarouselSettingsGroup => {
  return useMemo(() => {
    const normalizedSpeed = 100000;

    const topSliderSettings: CarouselSettings = {
      speed: normalizedSpeed,
      direction: "left",
    };

    const middleSliderSettings: CarouselSettings = {
      speed: normalizedSpeed,
      direction: "right",
    };

    const bottomSliderSettings: CarouselSettings = {
      speed: normalizedSpeed,
      direction: "left",
    };

    return {
      topSliderSettings,
      middleSliderSettings,
      bottomSliderSettings,
    };
  }, []);
};
