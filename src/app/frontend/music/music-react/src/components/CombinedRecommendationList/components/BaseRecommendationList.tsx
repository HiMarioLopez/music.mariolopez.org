import React, { useState } from 'react';
import { UpArrowIcon } from '../../Icons';
import '../CombinedRecommendationList.styles.css';

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

type BaseRecommendationListProps<T> = {
  recommendations: T[];
  onUpvote?: (index: number) => void;
  votedItems: Record<number, boolean>;
  renderItem: (item: T, index: number) => React.ReactNode;
  getImageUrl: (item: T) => string;
  getImageAlt: (item: T) => string;
  getVotes: (item: T) => number;
};

// Helper function to get appropriate label for screen readers
function getItemLabel<T extends Record<string, any>>(item: T): string {
  if (typeof item === 'object' && item !== null) {
    if ('songTitle' in item) {
      return item.songTitle;
    } else if ('albumTitle' in item) {
      return item.albumTitle;
    } else if ('artistName' in item) {
      return item.artistName;
    }
  }
  return 'item';
}

function BaseRecommendationList<T>({
  recommendations,
  onUpvote,
  votedItems,
  renderItem,
  getImageUrl,
  getImageAlt,
  getVotes
}: BaseRecommendationListProps<T>) {
  const [animatingItems, setAnimatingItems] = useState<Record<number, boolean>>({});

  if (recommendations.length === 0) {
    return (
      <div className="empty-recommendations">
        <p>No recommendations available. Be the first to suggest something!</p>
      </div>
    );
  }

  const handleUpvote = (index: number) => {
    // Skip if already voted
    if (votedItems[index]) return;

    // Call the parent component's onUpvote function
    if (onUpvote) {
      onUpvote(index);
    }

    // Set animation state
    setAnimatingItems(prev => ({
      ...prev,
      [index]: true
    }));

    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingItems(prev => ({
        ...prev,
        [index]: false
      }));
    }, 500);
  };

  return (
    <ul className="recommendation-items" role="list">
      {recommendations.map((recommendation, index) => (
        <li key={index}>
          <div className="recommendation-item-actions">
            <span className={`vote-count ${animatingItems[index] ? 'vote-count-highlight' : ''} ${votedItems[index] ? 'vote-count-permanent' : ''}`}>
              {formatNumber(getVotes(recommendation))}
            </span>
            <button
              className={`upvote-button ${animatingItems[index] ? 'voted' : ''} ${votedItems[index] ? 'voted-permanent' : ''}`}
              onClick={() => handleUpvote(index)}
              aria-label={`Upvote ${getItemLabel(recommendation as Record<string, any>)}. Current votes: ${formatNumber(getVotes(recommendation))}`}
              disabled={votedItems[index]}
              aria-pressed={votedItems[index]}
            >
              <UpArrowIcon />
            </button>
          </div>
          <img
            src={getImageUrl(recommendation)}
            alt={getImageAlt(recommendation)}
            loading="lazy"
          />
          <div className="recommendation-list-component-track-text-container">
            {renderItem(recommendation, index)}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default BaseRecommendationList; 