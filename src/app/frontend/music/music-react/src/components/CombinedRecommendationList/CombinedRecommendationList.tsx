import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './CombinedRecommendationList.styles.css';
import { RecommendationStateMap, RecommendationType } from './CombinedRecommendationList.types';
import { AlbumRecommendationList, ArtistRecommendationList, SkeletonLoader, SongRecommendationList } from './components';
import { useRecommendationSelector, simulateNetworkDelay } from './useRecommendationSelector';
import { useRecommendations } from '../../context/RecommendationsContext';

const CombinedRecommendationList: React.FC = () => {
    const { state, fetchRecommendations, upvoteRecommendation } = useRecommendations();

    const {
        selectedType,
        selectorContainerRef,
        labelRefs,
        handleTypeChange
    } = useRecommendationSelector('songs');

    const [songVotedItems, setSongVotedItems] = useState<Record<number, boolean>>({});
    const [albumVotedItems, setAlbumVotedItems] = useState<Record<number, boolean>>({});
    const [artistVotedItems, setArtistVotedItems] = useState<Record<number, boolean>>({});
    const [announcement, setAnnouncement] = useState('');
    const [artificialLoading, setArtificialLoading] = useState(false);

    useEffect(() => {
        const type = selectedType === 'songs' ? 'songs' :
            selectedType === 'albums' ? 'albums' : 'artists';

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

    const recommendationData: RecommendationStateMap = useMemo(() => ({
        songs: {
            recommendations: state.songs.items,
            votedItems: songVotedItems,
            setVotedItems: setSongVotedItems,
            component: SongRecommendationList
        },
        albums: {
            recommendations: state.albums.items,
            votedItems: albumVotedItems,
            setVotedItems: setAlbumVotedItems,
            component: AlbumRecommendationList
        },
        artists: {
            recommendations: state.artists.items,
            votedItems: artistVotedItems,
            setVotedItems: setArtistVotedItems,
            component: ArtistRecommendationList
        }
    }), [
        state.songs.items, songVotedItems, setSongVotedItems,
        state.albums.items, albumVotedItems, setAlbumVotedItems,
        state.artists.items, artistVotedItems, setArtistVotedItems
    ]);

    const handleUpvote = useCallback((index: number) => {
        const currentType = selectedType;
        const typeMapping = {
            'songs': 'songs',
            'albums': 'albums',
            'artists': 'artists'
        } as const;

        const { votedItems, setVotedItems } = recommendationData[currentType];
        const recommendations = recommendationData[currentType].recommendations;

        // Skip if already voted
        if (votedItems[index]) return;

        // Mark as voted
        setVotedItems((prev: Record<number, boolean>) => ({
            ...prev,
            [index]: true
        }));

        // Get item name for announcement
        let itemName = '';
        if (currentType === 'songs' && 'songTitle' in recommendations[index]) {
            itemName = recommendations[index].songTitle;
        } else if (currentType === 'albums' && 'albumTitle' in recommendations[index]) {
            itemName = recommendations[index].albumTitle;
        } else if (currentType === 'artists' && 'artistName' in recommendations[index]) {
            itemName = recommendations[index].artistName;
        }

        // Update vote via context
        upvoteRecommendation(typeMapping[currentType], index);

        // Announce the upvote
        const votes = recommendations[index].votes || 0;
        setAnnouncement(`You upvoted ${itemName}. New vote count: ${votes + 1}.`);
    }, [selectedType, recommendationData, upvoteRecommendation]);

    // Memoize the recommendation component render
    const currentRecommendationList = useMemo(() => {
        const { component: RecommendationComponent, recommendations, votedItems } =
            recommendationData[selectedType];

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
                votedItems={votedItems}
            />
        );
    }, [selectedType, recommendationData, handleUpvote]);

    // Update the loading check to include artificial loading
    const isLoading = state[selectedType === 'songs' ? 'songs' :
        selectedType === 'albums' ? 'albums' : 'artists'].loading || artificialLoading;

    // Get loading and error states from context
    const error = state[selectedType === 'songs' ? 'songs' :
        selectedType === 'albums' ? 'albums' : 'artists'].error;

    // Error display component
    const errorDisplay = useMemo(() => {
        if (!error) return null;

        return (
            <div className="recommendation-error" role="alert">
                <p>{error}</p>
                <button onClick={() => fetchRecommendations(selectedType === 'songs' ? 'songs' :
                    selectedType === 'albums' ? 'albums' : 'artists')}>
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
                            className={selectedType === type ? 'selected' : ''}
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
                <div
                    className="recommendation-content"
                    aria-live="polite"
                >
                    {currentRecommendationList}
                </div>
            )}
        </div>
    );
};

export default CombinedRecommendationList;
