import React from 'react';
import { RecommendedArtist } from '../../../types/Recommendations';
import BaseRecommendationList from './BaseRecommendationList';

type ArtistRecommendationListProps = {
    recommendations: RecommendedArtist[];
    onUpvote?: (index: number) => void;
    votedItems: Record<number, boolean>;
};

const ArtistRecommendationList: React.FC<ArtistRecommendationListProps> = ({
    recommendations,
    onUpvote,
    votedItems
}) => {
    return (
        <BaseRecommendationList
            recommendations={recommendations}
            onUpvote={onUpvote}
            votedItems={votedItems}
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