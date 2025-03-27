import { useState, useRef, useEffect } from "react";

type RecommendationType = "songs" | "albums" | "artists";

// Add this new utility function for artificial delay
export const simulateNetworkDelay = (ms: number = 1500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const useRecommendationSelector = (
  initialType: RecommendationType = "songs",
) => {
  const [selectedType, setSelectedType] =
    useState<RecommendationType>(initialType);

  // Create refs for labels and container
  const selectorContainerRef = useRef<HTMLDivElement>(null);
  const labelRefs = {
    songs: useRef<HTMLLabelElement>(null),
    albums: useRef<HTMLLabelElement>(null),
    artists: useRef<HTMLLabelElement>(null),
  };

  // Function to scroll the selected label into view
  const scrollLabelIntoView = (type: RecommendationType) => {
    if (labelRefs[type].current && selectorContainerRef.current) {
      const container = selectorContainerRef.current;
      const label = labelRefs[type].current;

      // Calculate scroll position to center the label
      const containerWidth = container.offsetWidth;
      const labelWidth = label.offsetWidth;
      const labelLeft = label.offsetLeft;

      // Center the label in the container
      const scrollPosition = labelLeft - containerWidth / 2 + labelWidth / 2;

      // Scroll with smooth behavior
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  // Initial scroll when component mounts or on resize
  useEffect(() => {
    const handleResize = () => {
      scrollLabelIntoView(selectedType);
    };

    window.addEventListener("resize", handleResize);

    // Initial scroll
    scrollLabelIntoView(selectedType);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedType, scrollLabelIntoView]);

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as RecommendationType;
    setSelectedType(newType);

    // Scroll the selected label into view
    scrollLabelIntoView(newType);
  };

  return {
    selectedType,
    selectorContainerRef,
    labelRefs,
    handleTypeChange,
    simulateNetworkDelay,
  };
};
