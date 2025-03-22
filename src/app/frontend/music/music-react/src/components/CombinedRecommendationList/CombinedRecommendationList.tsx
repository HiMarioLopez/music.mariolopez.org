import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RecommendedAlbum, RecommendedArtist, RecommendedSong } from '../../types/Recommendations';
import './CombinedRecommendationList.styles.css';
import { RecommendationStateMap, RecommendationType } from './CombinedRecommendationList.types';
import { AlbumRecommendationList, ArtistRecommendationList, SongRecommendationList } from './components';
import { useRecommendationSelector } from './useRecommendationSelector';

type CombinedRecommendationListProps = {
    songRecommendations: RecommendedSong[];
    albumRecommendations: RecommendedAlbum[];
    artistRecommendations: RecommendedArtist[];
    loading?: boolean;
    error?: string;
};

const CombinedRecommendationList: React.FC<CombinedRecommendationListProps> = ({
    songRecommendations: initialSongRecommendations,
    albumRecommendations: initialAlbumRecommendations,
    artistRecommendations: initialArtistRecommendations,
    loading = false,
    error
}) => {
    // Use the custom hook
    const {
        selectedType,
        animating,
        selectorContainerRef,
        labelRefs,
        handleTypeChange
    } = useRecommendationSelector('songs');

    // State for songs, albums, and artists
    const [songRecommendations, setSongRecommendations] = useState<RecommendedSong[]>(
        [...initialSongRecommendations].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    );
    const [albumRecommendations, setAlbumRecommendations] = useState<RecommendedAlbum[]>(
        [...initialAlbumRecommendations].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    );
    const [artistRecommendations, setArtistRecommendations] = useState<RecommendedArtist[]>(
        [...initialArtistRecommendations].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    );

    // Update recommendations when props change
    useEffect(() => {
        setSongRecommendations([...initialSongRecommendations].sort((a, b) => (b.votes || 0) - (a.votes || 0)));
    }, [initialSongRecommendations]);

    useEffect(() => {
        setAlbumRecommendations([...initialAlbumRecommendations].sort((a, b) => (b.votes || 0) - (a.votes || 0)));
    }, [initialAlbumRecommendations]);

    useEffect(() => {
        setArtistRecommendations([...initialArtistRecommendations].sort((a, b) => (b.votes || 0) - (a.votes || 0)));
    }, [initialArtistRecommendations]);

    // Track voted items for each recommendation type
    const [songVotedItems, setSongVotedItems] = useState<Record<number, boolean>>({});
    const [albumVotedItems, setAlbumVotedItems] = useState<Record<number, boolean>>({});
    const [artistVotedItems, setArtistVotedItems] = useState<Record<number, boolean>>({});

    // Add state for screen reader announcements
    const [announcement, setAnnouncement] = useState('');

    // Unified data structure for recommendation types
    const recommendationData: RecommendationStateMap = useMemo(() => ({
        songs: {
            recommendations: songRecommendations,
            setRecommendations: setSongRecommendations,
            votedItems: songVotedItems,
            setVotedItems: setSongVotedItems,
            component: SongRecommendationList
        },
        albums: {
            recommendations: albumRecommendations,
            setRecommendations: setAlbumRecommendations,
            votedItems: albumVotedItems,
            setVotedItems: setAlbumVotedItems,
            component: AlbumRecommendationList
        },
        artists: {
            recommendations: artistRecommendations,
            setRecommendations: setArtistRecommendations,
            votedItems: artistVotedItems,
            setVotedItems: setArtistVotedItems,
            component: ArtistRecommendationList
        }
    }), [
        songRecommendations, setSongRecommendations, songVotedItems, setSongVotedItems,
        albumRecommendations, setAlbumRecommendations, albumVotedItems, setAlbumVotedItems,
        artistRecommendations, setArtistRecommendations, artistVotedItems, setArtistVotedItems
    ]);

    // Use useCallback to memoize the handleUpvote function
    const handleUpvote = useCallback((index: number) => {
        const currentType = selectedType;
        const { votedItems, setVotedItems, setRecommendations, recommendations } =
            recommendationData[currentType as keyof RecommendationStateMap];

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
            itemName = (recommendations[index] as RecommendedSong).songTitle;
        } else if (currentType === 'albums' && 'albumTitle' in recommendations[index]) {
            itemName = (recommendations[index] as RecommendedAlbum).albumTitle;
        } else if (currentType === 'artists' && 'artistName' in recommendations[index]) {
            itemName = (recommendations[index] as RecommendedArtist).artistName;
        }

        // Update vote count and sort
        setRecommendations((prevRecommendations: any) => {
            const updatedRecommendations = [...prevRecommendations];
            const item = updatedRecommendations[index];
            const votes = item.votes || 0;
            updatedRecommendations[index] = { ...item, votes: votes + 1 };

            // Announce the upvote
            setAnnouncement(`You upvoted ${itemName}. New vote count: ${votes + 1}.`);

            // Sort by vote count
            return updatedRecommendations.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        });
    }, [selectedType, recommendationData]);

    // Memoize the recommendation component render
    const currentRecommendationList = useMemo(() => {
        const { component: RecommendationComponent, recommendations, votedItems } =
            recommendationData[selectedType as keyof RecommendationStateMap];

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

    // Error display component
    const errorDisplay = useMemo(() => {
        if (!error) return null;

        return (
            <div className="recommendation-error" role="alert">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }, [error]);

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

            {loading ? (
                <div className="loading-container" role="status" aria-live="polite">
                    <div className="loading-spinner" aria-hidden="true"></div>
                    <p>Loading recommendations...</p>
                </div>
            ) : (
                <div
                    className={`recommendation-content ${animating ? 'animating' : ''}`}
                    aria-live="polite"
                    aria-busy={animating}
                >
                    {currentRecommendationList}
                </div>
            )}
        </div>
    );
};

export default CombinedRecommendationList;
