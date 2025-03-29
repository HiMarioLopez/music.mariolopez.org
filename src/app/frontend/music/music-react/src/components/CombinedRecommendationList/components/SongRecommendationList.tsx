import React from "react";
import { RecommendedSong } from "../../../types/Recommendations";
import BaseRecommendationList from "./BaseRecommendationList";
import RecommendationItem from "./RecommendationItem";

type SongRecommendationListProps = {
  recommendations: RecommendedSong[];
  onUpvote?: (index: number) => void;
  onDownvote?: (index: number) => void;
  votedItems: Record<string, boolean>;
  downvotedItems: Record<string, boolean>;
  onAddNote?: (item: RecommendedSong) => void;
};

const SongRecommendationList: React.FC<SongRecommendationListProps> = ({
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
        <RecommendationItem item={item} type="song" notes={item.notes} />
      )}
    />
  );
};

export default SongRecommendationList;
