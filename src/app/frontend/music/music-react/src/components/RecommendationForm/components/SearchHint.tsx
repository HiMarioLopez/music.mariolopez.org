import React, { memo } from "react";
import { Result } from "../types/RecommendationForm.types";

type SearchHintProps = {
  hint: Result;
  index: number;
  isActive: boolean;
  onSelect: (name: string) => void;
};

const SearchHint: React.FC<SearchHintProps> = ({
  hint,
  index,
  isActive,
  onSelect,
}) => (
  <li
    key={`hint-${hint.id}`}
    id={`result-${index}`}
    data-index={index}
    onClick={() => onSelect(hint.name)}
    className={`hint-result ${isActive ? "active" : ""}`}
    role="option"
    aria-selected={isActive}
    tabIndex={-1}
  >
    <div className="result-info">
      <strong>{hint.name}</strong>
    </div>
  </li>
);

export default memo(SearchHint);
