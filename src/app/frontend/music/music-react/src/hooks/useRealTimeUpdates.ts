import { useEffect, useRef } from 'react';
import { useRecommendations } from '../context/RecommendationsContext';

/**
 * Hook that simulates real-time updates for recommendation items
 * @param enabled Whether real-time updates are enabled
 * @param interval The interval in milliseconds for updates (default: 3000ms)
 */
export const useRealTimeUpdates = (enabled: boolean = true, interval: number = 250) => {
  const { state, updateRecommendationInRealTime } = useRecommendations();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clean up any existing timer if real-time is disabled
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Function to generate a random update
    const generateRandomUpdate = () => {
      // Filter to only include types that have items
      const validTypes = (
        ['songs', 'albums', 'artists'] as const
      ).filter(type => state[type].items.length > 0);

      // If no valid types, don't do anything
      if (validTypes.length === 0) return;

      // Randomly select from valid types only
      const randomType = validTypes[Math.floor(Math.random() * validTypes.length)];

      // Get items for the selected type (we know it has items)
      const items = state[randomType].items;

      // Select a random item
      const randomIndex = Math.floor(Math.random() * items.length);

      // Generate a random vote increment (70% chance of +1 to +3, 30% chance of -1 to -2)
      let voteIncrement;
      const isUpvote = Math.random() < 0.7; // 70% chance for upvote

      if (isUpvote) {
        voteIncrement = Math.floor(Math.random() * 3) + 1; // +1 to +3
      } else {
        voteIncrement = -1 * (Math.floor(Math.random() * 2) + 1); // -1 or -2

        // Ensure we don't go below 0 votes
        const currentVotes = items[randomIndex].votes || 0;
        if (currentVotes + voteIncrement < 0) {
          voteIncrement = -currentVotes;
        }
      }

      // Only update if the vote increment isn't 0
      if (voteIncrement !== 0) {
        // Update the recommendation
        updateRecommendationInRealTime(randomType, randomIndex, voteIncrement);
      }
    };

    // Set up the interval to generate random updates
    timerRef.current = window.setInterval(generateRandomUpdate, interval);

    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, interval, state, updateRecommendationInRealTime]);

  // Return minimal controls for the simulation
  return {
    isRunning: !!timerRef.current,
    stopSimulation: () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
}; 