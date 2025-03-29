import React, { useState, useEffect, useRef } from "react";

interface RecommendationHighlightProps {
  children: React.ReactNode;
  votes: number;
  className?: string;
  forceHighlight?: boolean;
  lastUpdated?: string;
  itemId?: string; // ID of the item for clearing highlight
  onHighlightComplete?: (id: string) => void; // Callback to clear highlight
}

/**
 * A component that wraps recommendation items and highlights them
 * when their vote count changes or when they are updated/merged.
 */
const RecommendationHighlight: React.FC<RecommendationHighlightProps> = ({
  children,
  votes,
  className = "",
  forceHighlight = false,
  lastUpdated = "",
  itemId = "",
  onHighlightComplete,
}) => {
  const [prevVotes, setPrevVotes] = useState<number>(votes);
  const [prevUpdated, setPrevUpdated] = useState<string>(lastUpdated);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Use refs to track what we've already handled to prevent infinite re-highlights
  const handledHighlightRef = useRef<boolean>(false);
  const handledUpdateRef = useRef<string>("");

  // Reset the handled flags when the component unmounts or when the item changes
  useEffect(() => {
    handledHighlightRef.current = false;
    handledUpdateRef.current = "";

    return () => {
      handledHighlightRef.current = false;
      handledUpdateRef.current = "";
    };
  }, [itemId]);

  useEffect(() => {
    // Check for either vote changes or forced highlight (for merges)
    const votesChanged = prevVotes !== votes && prevVotes !== 0;
    const updateChanged =
      lastUpdated &&
      prevUpdated !== lastUpdated &&
      handledUpdateRef.current !== lastUpdated;

    // Only trigger highlight if we haven't already handled this specific update
    const shouldHighlightNow =
      (forceHighlight && !handledHighlightRef.current) ||
      votesChanged ||
      updateChanged;

    if (shouldHighlightNow) {
      // Mark this highlight as handled to prevent re-triggering
      if (forceHighlight) {
        handledHighlightRef.current = true;
      }

      if (updateChanged) {
        handledUpdateRef.current = lastUpdated;
      }

      // Start the animation
      setIsUpdating(true);

      // Remove highlight class after animation completes
      const timer = setTimeout(() => {
        setIsUpdating(false);

        // Call the completion callback
        if (
          (forceHighlight || updateChanged) &&
          onHighlightComplete &&
          itemId
        ) {
          onHighlightComplete(itemId);
        }
      }, 1600); // Slightly longer than animation duration to ensure it completes

      return () => clearTimeout(timer);
    }

    // Update previous values for later comparison
    setPrevVotes(votes);
    if (lastUpdated) {
      setPrevUpdated(lastUpdated);
    }
  }, [
    votes,
    prevVotes,
    forceHighlight,
    lastUpdated,
    prevUpdated,
    onHighlightComplete,
    itemId,
  ]);

  const highlightClass = isUpdating ? `${className}-updating` : "";

  return <div className={`${className} ${highlightClass}`}>{children}</div>;
};

export default RecommendationHighlight;
