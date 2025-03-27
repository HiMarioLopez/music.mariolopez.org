import React, { useState } from "react";
import { DownArrowIcon, UpArrowIcon } from "../../Icons/Icons";
import "../styles/index.css";
import RecommendationHighlight from "./RecommendationHighlight";
import { formatNumber } from "../../../utils/formatters";
import { getItemId, getItemLabel } from "../../../utils/accessibility";
import { getItemClassName } from "../../../utils/styles";

type BaseRecommendationListProps<T> = {
  recommendations: T[];
  onUpvote?: (index: number) => void;
  onDownvote?: (index: number) => void;
  votedItems: Record<string, boolean>;
  downvotedItems: Record<string, boolean>;
  renderItem: (item: T, index: number) => React.ReactNode;
  getImageUrl: (item: T) => string;
  getImageAlt: (item: T) => string;
  getVotes: (item: T) => number;
};

function BaseRecommendationList<T>({
  recommendations,
  onUpvote,
  onDownvote,
  votedItems,
  downvotedItems = {},
  renderItem,
  getImageUrl,
  getImageAlt,
  getVotes,
}: BaseRecommendationListProps<T>) {
  const [animatingItems, setAnimatingItems] = useState<Record<string, boolean>>(
    {},
  );
  const [animatingDownvoteItems, setAnimatingDownvoteItems] = useState<
    Record<string, boolean>
  >({});

  if (recommendations.length === 0) {
    return (
      <div className="empty-recommendations">
        <p>No recommendations available. Be the first to suggest something!</p>
      </div>
    );
  }

  const handleUpvote = (index: number) => {
    // Call the parent component's onUpvote function
    if (onUpvote) {
      onUpvote(index);
    }

    const itemId = getItemId(recommendations[index], index);

    // Set animation state
    setAnimatingItems((prev) => ({
      ...prev,
      [itemId]: true,
    }));

    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingItems((prev) => ({
        ...prev,
        [itemId]: false,
      }));
    }, 50);
  };

  const handleDownvote = (index: number) => {
    // Call the parent component's onDownvote function
    if (onDownvote) {
      onDownvote(index);
    }

    const itemId = getItemId(recommendations[index], index);

    // Set animation state
    setAnimatingDownvoteItems((prev) => ({
      ...prev,
      [itemId]: true,
    }));

    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingDownvoteItems((prev) => ({
        ...prev,
        [itemId]: false,
      }));
    }, 50);
  };

  return (
    <ul className="recommendation-items" role="list">
      {recommendations.map((recommendation, index) => {
        const className = getItemClassName(recommendation);
        const votes = getVotes(recommendation);
        const itemId = getItemId(recommendation, index);

        return (
          <RecommendationHighlight
            key={itemId}
            votes={votes}
            className={className}
          >
            <li>
              <div className="recommendation-item-actions">
                <button
                  className={`upvote-button ${
                    animatingItems[itemId] ? "voted" : ""
                  } ${votedItems[itemId] ? "voted-permanent" : ""}`}
                  onClick={() => handleUpvote(index)}
                  aria-label={`Upvote ${getItemLabel(
                    recommendation as Record<string, any>,
                  )}`}
                  aria-pressed={votedItems[itemId]}
                >
                  <UpArrowIcon />
                </button>
                <span
                  className={`vote-count ${
                    animatingItems[itemId] ? "vote-count-highlight" : ""
                  } ${
                    animatingDownvoteItems[itemId]
                      ? "vote-count-highlight-down"
                      : ""
                  } ${votedItems[itemId] ? "vote-count-permanent" : ""} ${
                    downvotedItems[itemId] ? "vote-count-permanent-down" : ""
                  }`}
                >
                  {formatNumber(votes)}
                </span>
                <button
                  className={`downvote-button ${
                    animatingDownvoteItems[itemId] ? "downvoted" : ""
                  } ${downvotedItems[itemId] ? "downvoted-permanent" : ""}`}
                  onClick={() => handleDownvote(index)}
                  aria-label={`Downvote ${getItemLabel(
                    recommendation as Record<string, any>,
                  )}`}
                  aria-pressed={downvotedItems[itemId]}
                >
                  <DownArrowIcon />
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
          </RecommendationHighlight>
        );
      })}
    </ul>
  );
}

export default BaseRecommendationList;
