import React, { memo } from "react";
import "../styles/ResultSectionHeader.styles.css";

type ResultSectionHeaderProps = {
  title: string;
};

const ResultSectionHeader: React.FC<ResultSectionHeaderProps> = ({ title }) => (
  <div className="result-section-header" role="presentation">
    {title}
  </div>
);

export default memo(ResultSectionHeader);
