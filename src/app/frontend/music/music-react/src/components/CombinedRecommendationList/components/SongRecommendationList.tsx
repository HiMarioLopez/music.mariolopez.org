import React from 'react';
import { RecommendedSong } from '../../../types/Recommendations';
import BaseRecommendationList from './BaseRecommendationList';

type SongRecommendationListProps = {
    recommendations: RecommendedSong[];
    onUpvote?: (index: number) => void;
    votedItems: Record<number, boolean>;
};

const SongRecommendationList: React.FC<SongRecommendationListProps> = ({
    recommendations,
    onUpvote,
    votedItems
}) => {
    return (
        <BaseRecommendationList
            recommendations={recommendations}
            onUpvote={onUpvote}
            votedItems={votedItems}
            getImageUrl={(item) => item.albumCoverUrl}
            getImageAlt={() => "Album Cover"}
            getVotes={(item) => item.votes || 0}
            renderItem={(item) => (
                <>
                    <h3>{item.songTitle}</h3>
                    <p>{item.artistName} - {item.albumName}</p>
                </>
            )}
        />
    );
};

export default SongRecommendationList; 