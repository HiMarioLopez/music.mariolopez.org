// API Service for music-related requests
import { SearchResult, SearchSuggestion } from '../components/RecommendationForm/RecommendationForm.types';

const API_BASE_URL = '/api/nodejs';

// Type for authentication response
interface AuthResponse {
    token: string;
    expiresAt?: number;
}

// Type for search suggestions response
interface SearchSuggestionsResponse {
    data: {
        results: {
            suggestions: SearchSuggestion[];
        };
    };
}

// Error handling class
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

// Fetch wrapper with error handling
const fetchWithErrorHandling = async <T>(
    url: string,
    options?: RequestInit
): Promise<T> => {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new ApiError(`API error: ${response.statusText}`, response.status);
        }

        return await response.json() as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            500
        );
    }
};

// Authentication service
export const authService = {
    // Storage keys
    STORAGE_TOKEN_KEY: 'music_app_auth_token',
    STORAGE_EXPIRES_KEY: 'music_app_auth_expires_at',

    async getDeveloperToken(): Promise<string> {
        const data = await fetchWithErrorHandling<AuthResponse>(
            `${API_BASE_URL}/auth/token`
        );

        if (!data.token) {
            throw new ApiError('Failed to retrieve authentication token', 401);
        }

        return data.token;
    },

    // Helper to cache and manage token
    token: null as string | null,
    tokenExpiresAt: null as number | null,
    tokenRefreshPromise: null as Promise<string> | null,

    // Load persisted token from storage
    loadPersistedToken(): boolean {
        try {
            const storedToken = localStorage.getItem(this.STORAGE_TOKEN_KEY);
            const storedExpiresAt = localStorage.getItem(this.STORAGE_EXPIRES_KEY);

            if (storedToken && storedExpiresAt) {
                const expiresAt = parseInt(storedExpiresAt, 10);
                // Only use stored token if it's not expired (with 5 min buffer)
                if (expiresAt > Date.now() + 300000) {
                    this.token = storedToken;
                    this.tokenExpiresAt = expiresAt;
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load persisted token:', error);
        }
        return false;
    },

    // Persist token to storage
    persistToken(token: string, expiresAt: number): void {
        try {
            localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
            localStorage.setItem(this.STORAGE_EXPIRES_KEY, expiresAt.toString());
        } catch (error) {
            console.warn('Failed to persist token:', error);
        }
    },

    async getTokenWithCache(): Promise<string> {
        // If not loaded yet, try to load from storage first
        if (!this.token && !this.tokenRefreshPromise) {
            this.loadPersistedToken();
        }

        // If a refresh is already in progress, wait for it
        if (this.tokenRefreshPromise) {
            return this.tokenRefreshPromise;
        }

        // Check if token exists and is not expired (with 5 min buffer)
        const now = Date.now();
        if (this.token && this.tokenExpiresAt && this.tokenExpiresAt > now + 300000) {
            return this.token;
        }

        // Fetch new token only when needed
        this.tokenRefreshPromise = this.getDeveloperToken()
            .then(token => {
                this.token = token;
                // Store expiration time (default to 1 hour if not specified)
                this.tokenExpiresAt = Date.now() + 3600000;
                // Persist to localStorage
                this.persistToken(token, this.tokenExpiresAt);
                this.tokenRefreshPromise = null;
                return token;
            })
            .catch(error => {
                this.tokenRefreshPromise = null;
                throw error;
            });

        return this.tokenRefreshPromise;
    },

    clearToken() {
        this.token = null;
        this.tokenExpiresAt = null;
        this.tokenRefreshPromise = null;
        // Also clear from storage
        try {
            localStorage.removeItem(this.STORAGE_TOKEN_KEY);
            localStorage.removeItem(this.STORAGE_EXPIRES_KEY);
        } catch (error) {
            console.warn('Failed to clear persisted token:', error);
        }
    }
};

// Try to load persisted token during module initialization
authService.loadPersistedToken();

// Fetch wrapper with auth retry
const fetchWithAuthRetry = async <T>(
    url: string,
    options?: RequestInit,
    retryAttempted: boolean = false
): Promise<T> => {
    try {
        const token = await authService.getTokenWithCache();
        const authOptions = {
            ...options,
            headers: {
                ...options?.headers,
                'Authorization': `Bearer ${token}`
            }
        };

        return await fetchWithErrorHandling<T>(url, authOptions);
    } catch (error) {
        // If we get an auth error and haven't retried yet, clear the token and try once more
        if (!retryAttempted &&
            error instanceof ApiError &&
            (error.status === 401 || error.status === 403)) {

            console.warn('Auth error detected, clearing token and retrying once');
            authService.clearToken();

            // Only retry once to prevent infinite loops
            return fetchWithAuthRetry<T>(url, options, true);
        }

        // If we've already retried or it's not an auth error, propagate the error
        throw error;
    }
};

// Export a unified API service
export const apiService = {
    // Music API methods
    music: {
        // All API methods will trigger auth only when called
        async searchSuggestions(
            term: string,
            limit: number = 3,
            types: string[] = ['songs', 'albums', 'artists'],
            kinds: string[] = ['terms', 'topResults']
        ): Promise<{
            termSuggestions: SearchResult[],
            contentResults: SearchResult[]
        }> {
            const queryParams = new URLSearchParams({
                term: term,
                limit: limit.toString(),
                types: types.join(','),
                kinds: kinds.join(',')
            });

            // Using the new fetchWithAuthRetry which handles auth token internally
            const data = await fetchWithAuthRetry<SearchSuggestionsResponse>(
                `${API_BASE_URL}/apple-music/catalog/us/search/suggestions?${queryParams}`,
                {}
            );

            // Parse term suggestions
            const termSuggestions = data.data.results.suggestions
                .filter((suggestion: SearchSuggestion) => suggestion.kind === 'terms')
                .map((suggestion: SearchSuggestion) => ({
                    id: suggestion.searchTerm || suggestion.displayTerm || '',
                    name: suggestion.displayTerm || suggestion.searchTerm || '',
                    type: 'hint' as const
                })) || [];

            // Parse content results
            const contentResults = data.data.results.suggestions
                .filter((suggestion: SearchSuggestion) =>
                    suggestion.kind === 'topResults' && suggestion.content)
                .map((suggestion: SearchSuggestion) => {
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

            return { termSuggestions, contentResults };
        }
    }
};

// For backward compatibility
export const musicApiService = apiService.music; 