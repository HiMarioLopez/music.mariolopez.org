import React, { memo } from "react";
import { LoadingIcon } from "../../Icons";

type ShowMoreButtonProps = {
  index: number;
  isActive: boolean;
  onClick: () => void;
  text: string;
  isLoading?: boolean;
};

const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  index,
  isActive,
  onClick,
  text,
  isLoading
}) => (
  <li
    id={`result-${index}`}
    data-index={index}
    className={`hint-result show-more ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
    onClick={onClick}
    role="option"
    aria-selected={isActive}
    tabIndex={-1}
  >
    <div className="result-info">
      {isLoading ? (
        <div className="inline-loader">
          <LoadingIcon />
          <span>Loading more results...</span>
        </div>
      ) : (
        <span className="show-more-text">{text}</span>
      )}
    </div>
  </li>
);

export default memo(ShowMoreButton);
