import React from 'react';
import { RecommendedArtist } from '../../../types/Recommendations';
import BaseRecommendationList from './BaseRecommendationList';

type ArtistRecommendationListProps = {
    recommendations: RecommendedArtist[];
    onUpvote?: (index: number) => void;
    onDownvote?: (index: number) => void;
    votedItems: Record<string, boolean>;
    downvotedItems: Record<string, boolean>;
};

const ArtistRecommendationList: React.FC<ArtistRecommendationListProps> = ({
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
            getImageUrl={(item) => item.artistImageUrl}
            getImageAlt={() => "Artist"}
            getVotes={(item) => item.votes || 0}
            renderItem={(item) => (
                <>
                    <h3>{item.artistName}</h3>
                    {item.genres && item.genres.length > 0 && (
                        <p>{item.genres.join(', ')}</p>
                    )}
                </>
            )}
        />
    );
};

export default ArtistRecommendationList; 