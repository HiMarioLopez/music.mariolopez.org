export interface CarouselSettings {
  speed: number;
  direction: "left" | "right";
}

export interface CarouselSettingsGroup {
  topSliderSettings: CarouselSettings;
  middleSliderSettings: CarouselSettings;
  bottomSliderSettings: CarouselSettings;
}

const settings: CarouselSettingsGroup = {
  topSliderSettings: {
    speed: 100000,
    direction: "left",
  },
  middleSliderSettings: {
    speed: 100000,
    direction: "right",
  },
  bottomSliderSettings: {
    speed: 100000,
    direction: "left",
  },
};

export const useCarouselSettings = (): CarouselSettingsGroup => {
  return settings;
};
