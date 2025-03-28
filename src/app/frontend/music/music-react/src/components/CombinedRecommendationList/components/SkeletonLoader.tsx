import React, { memo } from "react";

/**
 * Skeleton loader component for the Combined Recommendation List
 * Shows placeholder content while data is loading
 */
const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <ul className="recommendation-items">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <li key={index} className="skeleton-item">
            <div className="skeleton-shine"></div>
            <div className="skeleton-votes">
              <div className="skeleton-vote-count"></div>
              <div className="skeleton-vote-button"></div>
            </div>
            <div className="skeleton-image"></div>
            <div className="skeleton-text">
              <div className="skeleton-title"></div>
              <div className="skeleton-subtitle"></div>
            </div>
          </li>
        ))}
    </ul>
  );
};

export default memo(SkeletonLoader);
