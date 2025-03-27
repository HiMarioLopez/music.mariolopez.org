import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRecommendations } from "../../context/RecommendationsContext";
import {
  RecommendationStateMap,
  RecommendationType,
} from "./types/CombinedRecommendationList.types";
import AlbumRecommendationList from "./components/AlbumRecommendationList";
import ArtistRecommendationList from "./components/ArtistRecommendationList";
import SkeletonLoader from "./components/SkeletonLoader";
import SongRecommendationList from "./components/SongRecommendationList";
import "./styles/index.css";
import {
  simulateNetworkDelay,
  useRecommendationSelector,
} from "./hooks/useRecommendationSelector";

const CombinedRecommendationList: React.FC = () => {
  const {
    state,
    fetchRecommendations,
    upvoteRecommendation,
    downvoteRecommendation,
  } = useRecommendations();

  const { selectedType, selectorContainerRef, labelRefs, handleTypeChange } =
    useRecommendationSelector("songs");

  // Track voted items by ID instead of index
  const [songVotedItems, setSongVotedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [albumVotedItems, setAlbumVotedItems] = useState<
    Record<string, boolean>
  >({});
  const [artistVotedItems, setArtistVotedItems] = useState<
    Record<string, boolean>
  >({});

  const [songDownvotedItems, setSongDownvotedItems] = useState<
    Record<string, boolean>
  >({});
  const [albumDownvotedItems, setAlbumDownvotedItems] = useState<
    Record<string, boolean>
  >({});
  const [artistDownvotedItems, setArtistDownvotedItems] = useState<
    Record<string, boolean>
  >({});

  const [announcement, setAnnouncement] = useState("");
  const [artificialLoading, setArtificialLoading] = useState(false);

  useEffect(() => {
    const type =
      selectedType === "songs"
        ? "songs"
        : selectedType === "albums"
          ? "albums"
          : "artists";

    // Only run this effect when the selected type changes or loading state changes
    if (!state[type].loaded && !state[type].loading) {
      const loadRecommendations = async () => {
        setArtificialLoading(true);
        await simulateNetworkDelay(500);
        fetchRecommendations(type);
        setArtificialLoading(false);
      };

      loadRecommendations();
    }
  }, [selectedType, fetchRecommendations, state]);

  const recommendationData: RecommendationStateMap = useMemo(
    () => ({
      songs: {
        recommendations: state.songs.items,
        votedItems: songVotedItems,
        downvotedItems: songDownvotedItems,
        setVotedItems: setSongVotedItems,
        setDownvotedItems: setSongDownvotedItems,
        component: SongRecommendationList,
      },
      albums: {
        recommendations: state.albums.items,
        votedItems: albumVotedItems,
        downvotedItems: albumDownvotedItems,
        setVotedItems: setAlbumVotedItems,
        setDownvotedItems: setAlbumDownvotedItems,
        component: AlbumRecommendationList,
      },
      artists: {
        recommendations: state.artists.items,
        votedItems: artistVotedItems,
        downvotedItems: artistDownvotedItems,
        setVotedItems: setArtistVotedItems,
        setDownvotedItems: setArtistDownvotedItems,
        component: ArtistRecommendationList,
      },
    }),
    [
      state.songs.items,
      songVotedItems,
      setSongVotedItems,
      songDownvotedItems,
      setSongDownvotedItems,
      state.albums.items,
      albumVotedItems,
      setAlbumVotedItems,
      albumDownvotedItems,
      setAlbumDownvotedItems,
      state.artists.items,
      artistVotedItems,
      setArtistVotedItems,
      artistDownvotedItems,
      setArtistDownvotedItems,
    ],
  );

  const handleUpvote = useCallback(
    (index: number) => {
      const currentType = selectedType;
      const typeMapping = {
        songs: "songs",
        albums: "albums",
        artists: "artists",
      } as const;

      const { votedItems, setVotedItems, downvotedItems, setDownvotedItems } =
        recommendationData[currentType];
      const recommendations = recommendationData[currentType].recommendations;
      const item = recommendations[index];

      // Get item ID or use index as fallback
      const itemId = (item as Record<string, any>).id || `index_${index}`;

      // Get item name for announcement
      let itemName = "";
      if (currentType === "songs" && "songTitle" in item) {
        itemName = item.songTitle;
      } else if (currentType === "albums" && "albumTitle" in item) {
        itemName = item.albumTitle;
      } else if (currentType === "artists" && "artistName" in item) {
        itemName = item.artistName;
      }

      // If already upvoted, remove the vote
      if (votedItems[itemId]) {
        setVotedItems((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });

        // Update vote via context
        upvoteRecommendation(typeMapping[currentType], index);

        // Announce the vote removal
        setAnnouncement(`You removed your upvote from ${itemName}.`);
        return;
      }

      // If previously downvoted, need to remove the downvote status
      if (downvotedItems[itemId]) {
        setDownvotedItems((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });
      }

      // Mark as upvoted
      setVotedItems((prev: Record<string, boolean>) => ({
        ...prev,
        [itemId]: true,
      }));

      // Update vote via context
      upvoteRecommendation(typeMapping[currentType], index);

      // Announce the upvote
      const votes = item.votes || 0;
      const voteChange = downvotedItems[itemId] ? "+2" : "+1";
      setAnnouncement(
        `You upvoted ${itemName}. New vote count: ${votes + (downvotedItems[itemId] ? 2 : 1)} (${voteChange}).`,
      );
    },
    [selectedType, recommendationData, upvoteRecommendation],
  );

  const handleDownvote = useCallback(
    (index: number) => {
      const currentType = selectedType;
      const typeMapping = {
        songs: "songs",
        albums: "albums",
        artists: "artists",
      } as const;

      const { votedItems, setVotedItems, downvotedItems, setDownvotedItems } =
        recommendationData[currentType];
      const recommendations = recommendationData[currentType].recommendations;
      const item = recommendations[index];

      // Get item ID or use index as fallback
      const itemId = (item as Record<string, any>).id || `index_${index}`;

      // Get item name for announcement
      let itemName = "";
      if (currentType === "songs" && "songTitle" in item) {
        itemName = item.songTitle;
      } else if (currentType === "albums" && "albumTitle" in item) {
        itemName = item.albumTitle;
      } else if (currentType === "artists" && "artistName" in item) {
        itemName = item.artistName;
      }

      // If already downvoted, remove the vote
      if (downvotedItems[itemId]) {
        setDownvotedItems((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });

        // Update vote via context
        downvoteRecommendation(typeMapping[currentType], index);

        // Announce the vote removal
        setAnnouncement(`You removed your downvote from ${itemName}.`);
        return;
      }

      // If previously upvoted, need to remove the upvote status
      if (votedItems[itemId]) {
        setVotedItems((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });
      }

      // Mark as downvoted
      setDownvotedItems((prev: Record<string, boolean>) => ({
        ...prev,
        [itemId]: true,
      }));

      // Update vote via context
      downvoteRecommendation(typeMapping[currentType], index);

      // Announce the downvote
      const votes = item.votes || 0;
      const voteChange = votedItems[itemId] ? "-2" : "-1";
      const newVotes = Math.max(0, votes - (votedItems[itemId] ? 2 : 1));
      setAnnouncement(
        `You downvoted ${itemName}. New vote count: ${newVotes} (${voteChange}).`,
      );
    },
    [selectedType, recommendationData, downvoteRecommendation],
  );

  // Memoize the recommendation component render
  const currentRecommendationList = useMemo(() => {
    const {
      component: RecommendationComponent,
      recommendations,
      votedItems,
      downvotedItems,
    } = recommendationData[selectedType];

    if (recommendations.length === 0) {
      return (
        <div className="empty-recommendations" role="status">
          <p>No recommendations available for this category yet.</p>
        </div>
      );
    }

    return (
      <RecommendationComponent
        recommendations={recommendations}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        votedItems={votedItems}
        downvotedItems={downvotedItems}
      />
    );
  }, [selectedType, recommendationData, handleUpvote, handleDownvote]);

  // Update the loading check to include artificial loading
  const isLoading =
    state[
      selectedType === "songs"
        ? "songs"
        : selectedType === "albums"
          ? "albums"
          : "artists"
    ].loading || artificialLoading;

  // Get loading and error states from context
  const error =
    state[
      selectedType === "songs"
        ? "songs"
        : selectedType === "albums"
          ? "albums"
          : "artists"
    ].error;

  // Error display component
  const errorDisplay = useMemo(() => {
    if (!error) return null;

    return (
      <div className="recommendation-error" role="alert">
        <p>{error}</p>
        <button
          onClick={() =>
            fetchRecommendations(
              selectedType === "songs"
                ? "songs"
                : selectedType === "albums"
                  ? "albums"
                  : "artists",
            )
          }
        >
          Retry
        </button>
      </div>
    );
  }, [error, fetchRecommendations, selectedType]);

  return (
    <div className="recommendation-list-component styled-container">
      {/* Screen reader announcements */}
      <div className="visually-hidden" aria-live="polite">
        {announcement}
      </div>

      <div className="recommendation-header">
        <h1 id="recommendation-title">Recommendation Leaderboard</h1>
        <div
          className="recommendation-radio-selector"
          ref={selectorContainerRef}
          role="radiogroup"
          aria-labelledby="recommendation-title"
        >
          {Object.keys(recommendationData).map((type) => (
            <label
              key={type}
              className={selectedType === type ? "selected" : ""}
              ref={labelRefs[type as RecommendationType]}
            >
              <input
                type="radio"
                name="recommendationType"
                value={type}
                checked={selectedType === type}
                onChange={handleTypeChange}
                aria-checked={selectedType === type}
              />
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      {errorDisplay}

      {isLoading ? (
        <div className="recommendation-content">
          <SkeletonLoader />
        </div>
      ) : (
        <div className="recommendation-content" aria-live="polite">
          {currentRecommendationList}
        </div>
      )}
    </div>
  );
};

export default CombinedRecommendationList;
