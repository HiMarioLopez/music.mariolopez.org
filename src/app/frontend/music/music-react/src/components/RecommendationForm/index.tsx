import React, { useState, useEffect, useRef } from 'react';
import './index.css';

type SearchResult = {
    id: string;
    name: string;
    artist?: string;
    album?: string;
    type?: 'songs' | 'albums' | 'artists' | 'hint';
    artworkUrl?: string;
    // Album specific fields
    trackCount?: number;
    releaseDate?: string;
    // Artist specific fields
    genres?: string[];
}

type RecommendationFormProps = {
    onRecommend: (songTitle: string) => void;
};

// Update types to handle different content types
type TopResult = {
    id: string;
    type: 'songs' | 'albums' | 'artists';
    attributes: {
        name: string;
        artistName?: string;
        albumName?: string;
        artwork?: {
            url: string;
        };
        genreNames?: string[];
        releaseDate?: string;
        trackCount?: number;
    };
};

type SearchSuggestion = {
    kind: 'terms' | 'topResults';
    searchTerm?: string;
    displayTerm?: string;
    content?: TopResult;
};

// Add this new component for the search icon
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

// Add this for the loading spinner (you already have this SVG)
const LoadingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    </svg>
);

// Add this new icon component for the X
const ClearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const RecommendationForm: React.FC<RecommendationFormProps> = ({ onRecommend }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hintResults, setHintResults] = useState<SearchResult[]>([]);
    const [songResults, setSongResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [developerToken, setDeveloperToken] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [isResultsVisible, setIsResultsVisible] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [showAllResults, setShowAllResults] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchDeveloperToken = async () => {
        setIsAuthenticating(true);
        try {
            const response = await fetch('/api/nodejs/auth/token');
            const data = await response.json();

            if (data.token) {
                setDeveloperToken(data.token);
                setTokenError(null);
                return data.token;
            } else {
                setTokenError('Failed to retrieve authentication token');
                return null;
            }
        } catch (error) {
            console.error('Error fetching developer token:', error);
            setTokenError('Failed to connect to authentication service');
            return null;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            searchContainerRef.current &&
            !searchContainerRef.current.contains(event.target as Node)
        ) {
            setIsResultsVisible(false);
        }
    };

    // Add event listener for clicks outside
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Modify the performSearch function to accept a limit parameter
    const performSearch = async (term: string, limit: number = 3) => {
        if (!developerToken) return;

        const isLoadingMore = limit > 3;
        if (!isLoadingMore) {
            setIsLoading(true);
        }

        try {
            const response = await fetch(
                `/api/nodejs/apple-music/catalog/us/search/suggestions?term=${encodeURIComponent(term)}&kinds=terms,topResults&types=songs,albums,artists&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${developerToken}`
                    }
                }
            );

            const data = await response.json();

            // Handle term suggestions (always keep this at 3)
            const termSuggestions = data?.data?.results?.suggestions
                ?.filter((suggestion: SearchSuggestion) => suggestion.kind === 'terms')
                ?.map((suggestion: SearchSuggestion) => ({
                    id: suggestion.searchTerm || suggestion.displayTerm,
                    name: suggestion.displayTerm || suggestion.searchTerm,
                    type: 'hint'
                })) || [];

            // Handle content results
            const contentResults = data?.data?.results?.suggestions
                ?.filter((suggestion: SearchSuggestion) =>
                    suggestion.kind === 'topResults' && suggestion.content)
                ?.map((suggestion: SearchSuggestion) => {
                    const content = suggestion.content!;
                    return {
                        id: content.id,
                        name: content.attributes.name,
                        artist: content.attributes.artistName,
                        album: content.attributes.albumName,
                        artworkUrl: content.attributes.artwork?.url?.replace('{w}', '40').replace('{h}', '40'),
                        type: content.type,
                        trackCount: content.attributes.trackCount,
                        releaseDate: content.attributes.releaseDate,
                        genres: content.attributes.genreNames
                    };
                }) || [];

            // If we're loading more, append to existing results
            // If it's a new search, replace results
            if (isLoadingMore) {
                setSongResults(prev => [...prev, ...contentResults.slice(3)]);
                setShowAllResults(true);
            } else {
                setHintResults(termSuggestions);
                setSongResults(contentResults);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            if (isLoadingMore) {
                setIsLoadingMore(false);
            } else {
                setIsLoading(false);
            }
        }
    };

    // Add a handler for loading more results
    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        await performSearch(searchTerm, 10);
    };

    // Update the search effect to use the default limit
    useEffect(() => {
        if (searchTerm.length <= 1) {
            setHintResults([]);
            setSongResults([]);
            setIsResultsVisible(false);
            setShowAllResults(false);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            if (!developerToken) {
                const token = await fetchDeveloperToken();
                if (!token) return;
            }

            setIsResultsVisible(true);
            performSearch(searchTerm); // Uses default limit of 3
        }, 200);

        return () => clearTimeout(searchTimeout);
    }, [searchTerm, developerToken]);

    const handleHintSelect = (hint: string) => {
        setSearchTerm(hint);
        // Don't clear results - just update the search term which will trigger a new search
    };

    const handleSongSelect = (result: SearchResult) => {
        onRecommend(result.name);
        setSearchTerm('');
        setHintResults([]);
        setSongResults([]);
        setIsResultsVisible(false);
    };

    // Check if we have any results to show
    const hasResults = hintResults.length > 0 || songResults.length > 0;

    // Add a handler for clearing the search
    const handleClearSearch = () => {
        setSearchTerm('');
        setHintResults([]);
        setSongResults([]);
        setIsResultsVisible(false);
        setShowAllResults(false);
    };

    // If we're still fetching the token or there's an error
    if (tokenError) {
        return (
            <div className="recommendation-form-component styled-container">
                <h1>Make a Recommendation</h1>
                <div className="auth-error">
                    <p>{tokenError}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="recommendation-form-component styled-container">
            <h1>Make a Recommendation</h1>
            <div className="search-container" ref={searchContainerRef}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for a song..."
                        required
                        disabled={isAuthenticating}
                        onFocus={() => hasResults && setIsResultsVisible(true)}
                    />
                    <button
                        className={`search-button ${(isLoading || isAuthenticating) ? 'spinning' : ''}`}
                        disabled={isAuthenticating}
                        onClick={() => {
                            if (searchTerm && !isLoading && !isAuthenticating) {
                                handleClearSearch();
                            }
                        }}
                        type="button"
                        title={isLoading ? "Searching..." :
                            searchTerm ? "Clear search" : "Search"}
                    >
                        {(isLoading || isAuthenticating) ? <LoadingIcon /> :
                            searchTerm ? <ClearIcon /> : <SearchIcon />}
                    </button>
                </div>

                {hasResults && isResultsVisible && (
                    <ul className="search-results">
                        {hintResults.length > 0 && (
                            <>
                                <div className="result-section-header">
                                    Suggested Searches
                                </div>
                                {(showAllResults ? hintResults : hintResults.slice(0, 3)).map(result => (
                                    <li
                                        key={`hint-${result.id}`}
                                        onClick={() => handleHintSelect(result.name)}
                                        className="hint-result"
                                    >
                                        <div className="result-info">
                                            <strong>{result.name}</strong>
                                        </div>
                                    </li>
                                ))}
                                {!showAllResults && hintResults.length > 3 && (
                                    <li
                                        className="hint-result show-more"
                                        onClick={() => setShowAllResults(true)}
                                    >
                                        <div className="result-info">
                                            <span className="show-more-text">Show more suggestions...</span>
                                        </div>
                                    </li>
                                )}
                            </>
                        )}

                        {songResults.length > 0 && (
                            <>
                                <div className="result-section-header">
                                    Search Results
                                </div>
                                {(showAllResults ? songResults : songResults.slice(0, 3)).map(result => (
                                    <li
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSongSelect(result)}
                                        className={`${result.type}-result`}
                                    >
                                        {result.artworkUrl && (
                                            <img
                                                src={result.artworkUrl}
                                                alt={result.name}
                                                className="result-artwork"
                                            />
                                        )}
                                        <div className="result-info">
                                            <div className="result-info-text">
                                                <strong>{result.name}</strong>
                                                {result.type === 'songs' && (
                                                    <>
                                                        {result.artist && <span> by {result.artist}</span>}
                                                        {result.album && <span> • {result.album}</span>}
                                                    </>
                                                )}
                                                {result.type === 'albums' && (
                                                    <>
                                                        {result.artist && <span> by {result.artist}</span>}
                                                        {result.trackCount && <span> • {result.trackCount} tracks</span>}
                                                    </>
                                                )}
                                                {result.type === 'artists' && (
                                                    result.genres && <span>{result.genres[0]}</span>
                                                )}
                                            </div>
                                            <span className={`type-indicator ${result.type}`}>
                                                {result.type === 'songs' ? 'Song' :
                                                    result.type === 'albums' ? 'Album' : 'Artist'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                                {!showAllResults && songResults.length === 3 && (
                                    <li
                                        className="result-item show-more"
                                        onClick={handleLoadMore}
                                    >
                                        <div className="result-info">
                                            <span className="show-more-text">
                                                {isLoadingMore ? (
                                                    <div className="inline-loader">
                                                        <LoadingIcon />
                                                        Loading more results...
                                                    </div>
                                                ) : (
                                                    "Show more results..."
                                                )}
                                            </span>
                                        </div>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RecommendationForm;
