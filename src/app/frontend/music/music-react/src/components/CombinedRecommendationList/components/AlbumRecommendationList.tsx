import React from "react";
import { RecommendedAlbum } from "../../../types/Recommendations";
import BaseRecommendationList from "./BaseRecommendationList";
import RecommendationItem from "./RecommendationItem";

type AlbumRecommendationListProps = {
  recommendations: RecommendedAlbum[];
  onUpvote?: (index: number) => void;
  onDownvote?: (index: number) => void;
  votedItems: Record<string, boolean>;
  downvotedItems: Record<string, boolean>;
};

const AlbumRecommendationList: React.FC<AlbumRecommendationListProps> = ({
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
      getImageUrl={(item) => item.albumCoverUrl}
      getImageAlt={() => "Album Cover"}
      getVotes={(item) => item.votes || 0}
      renderItem={(item) => (
        <RecommendationItem item={item} type="album" notes={item.notes} />
      )}
    />
  );
};

export default AlbumRecommendationList;
