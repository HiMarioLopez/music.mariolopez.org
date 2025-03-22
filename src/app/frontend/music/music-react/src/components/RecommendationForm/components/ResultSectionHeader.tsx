import React, { memo } from 'react';

type ResultSectionHeaderProps = {
    title: string;
};

const ResultSectionHeader: React.FC<ResultSectionHeaderProps> = ({ title }) => (
    <div className="result-section-header" role="presentation">
        {title}
    </div>
);

export default memo(ResultSectionHeader);