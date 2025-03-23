import React, { useState, useEffect } from 'react';

interface RecommendationHighlightProps {
  children: React.ReactNode;
  votes: number;
  className?: string;
}

/**
 * A component that wraps recommendation items and highlights them
 * when their vote count changes.
 */
const RecommendationHighlight: React.FC<RecommendationHighlightProps> = ({
  children,
  votes,
  className = ''
}) => {
  const [prevVotes, setPrevVotes] = useState<number>(votes);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    // Only highlight if votes have changed and not on initial render
    if (prevVotes !== votes && prevVotes !== 0) {
      setIsUpdating(true);

      // Remove highlight class after animation completes
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 1500); // Match this to the animation duration in CSS

      return () => clearTimeout(timer);
    }

    setPrevVotes(votes);
  }, [votes, prevVotes]);

  const highlightClass = isUpdating ? `${className}-updating` : '';

  return (
    <div className={`${className} ${highlightClass}`}>
      {children}
    </div>
  );
};

export default RecommendationHighlight; 