import React from 'react';
import { RecommendedSong } from '../../../types/Recommendations';
import BaseRecommendationList from './BaseRecommendationList';

type SongRecommendationListProps = {
    recommendations: RecommendedSong[];
    onUpvote?: (index: number) => void;
    onDownvote?: (index: number) => void;
    votedItems: Record<string, boolean>;
    downvotedItems: Record<string, boolean>;
};

const SongRecommendationList: React.FC<SongRecommendationListProps> = ({
    recommendations,
    onUpvote,
    onDownvote,
    votedItems,
    downvotedItems = {}
}) => {
    return (
        <BaseRecommendationList
            recommendations={recommendations}
            onUpvote={onUpvote}
            onDownvote={onDownvote}
            votedItems={votedItems}
            downvotedItems={downvotedItems}
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