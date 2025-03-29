import React from "react";
import { RecommendedArtist } from "../../../types/Recommendations";
import BaseRecommendationList from "./BaseRecommendationList";
import RecommendationItem from "./RecommendationItem";

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
  downvotedItems = {},
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
        <RecommendationItem item={item} type="artist" notes={item.notes} />
      )}
    />
  );
};

export default ArtistRecommendationList;
