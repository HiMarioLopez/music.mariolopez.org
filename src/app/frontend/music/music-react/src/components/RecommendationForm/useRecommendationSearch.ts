import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { ApiError, authService, musicApiService } from '../../services/apiService';
import { Result } from './RecommendationForm.types';

export const useRecommendationSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHints, setSearchHints] = useState<Result[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wasInputFocused = useRef(false);
  const lastActiveElement = useRef<Element | null>(null);
  const needsFocusRestore = useRef(false);

  // Track the active element when states change
  const trackFocus = useCallback(() => {
    // Track active element only if it's our input
    if (document.activeElement === inputRef.current) {
      wasInputFocused.current = true;
      lastActiveElement.current = inputRef.current;
      needsFocusRestore.current = true;
    }
  }, []);

  // Authenticate function that will be called only when needed
  const authenticate = async () => {
    try {
      // Track focus before authentication
      trackFocus();
      setIsAuthenticating(true);
      await authService.getTokenWithCache();
      setTokenError(null);
      return true;
    } catch (error) {
      // Improved error logging
      console.error('Authentication error details:', error);

      const message = error instanceof ApiError
        ? `${error.message} (Status: ${error.status})`
        : 'Failed to connect to authentication service';

      setTokenError(message);
      console.error('Auth error:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Debounced search function to prevent too many API calls
  const debouncedSearch = useDebouncedCallback(async (term: string, limit: number = 3) => {
    try {
      // Track focus before search
      trackFocus();

      // Set loading state based on whether this is loading more or a new search
      if (limit > 3) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      // Authenticate before searching if needed
      if (!authService.token) {
        const authSuccess = await authenticate();
        if (!authSuccess) return; // Don't proceed with search if auth failed
      }

      const { termSuggestions, contentResults } = await musicApiService.searchSuggestions(
        term,
        limit
      );

      // If we're loading more, append to existing results
      // If it's a new search, replace results
      if (limit > 3) {
        setResults(prev => [...prev, ...contentResults.slice(3)]);
        setShowAllResults(true);
      } else {
        setSearchHints(termSuggestions);
        setResults(contentResults);
      }

      // Show results after successful search
      setIsResultsVisible(true);
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError && error.status === 401) {
        // Token expired, clear it and try again
        authService.clearToken();
        setTokenError('Authentication expired. Please try again.');
      } else {
        console.error('Search error:', error);
      }
    } finally {
      // Reset loading states
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, 300); // 300ms debounce delay

  // More aggressive focus restoration on state changes
  useLayoutEffect(() => {
    // Only restore focus if we need to and operations are complete
    if (needsFocusRestore.current &&
      !isLoading &&
      !isAuthenticating &&
      inputRef.current) {

      // Try multiple focus attempts to ensure it works
      // First attempt - immediate
      inputRef.current.focus();

      // Second attempt - use setTimeout for potential race conditions in React's rendering
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: false });
          // Only clear the flag after we're sure focus was restored
          needsFocusRestore.current = false;
        }
      }, 0);
    }
  }, [isLoading, isAuthenticating]);

  // Ensure input always exists in the DOM and has focus when needed
  useEffect(() => {
    // This runs on mount - make sure the ref is available
    if (!wasInputFocused.current && inputRef.current) {
      // Ensure the input is ready to receive focus later
      // No need to actually focus it now
      lastActiveElement.current = inputRef.current;
    }
  }, []);

  // Search effect
  useEffect(() => {
    if (searchTerm.length <= 1) {
      setSearchHints([]);
      setResults([]);
      setIsResultsVisible(false);
      setShowAllResults(false);
      return;
    }

    // Only trigger search if not currently loading or authenticating
    if (!isAuthenticating && !tokenError) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, isAuthenticating, tokenError, debouncedSearch]);

  // Memoized callbacks to prevent unnecessary rerenders
  const handleHintSelect = useCallback((hint: string) => {
    // Track focus before changing search term
    trackFocus();
    setSearchTerm(hint);
  }, [trackFocus]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isLoading) return;
    // Track focus before loading more
    trackFocus();
    await debouncedSearch(searchTerm, 10);
  }, [searchTerm, isLoadingMore, isLoading, debouncedSearch, trackFocus]);

  const handleClearSearch = useCallback(() => {
    // Track focus before clearing
    trackFocus();
    setSearchTerm('');
    setSearchHints([]);
    setResults([]);
    setIsResultsVisible(false);
    setShowAllResults(false);
  }, [trackFocus]);

  const handleResultsVisibility = useCallback((isVisible: boolean) => {
    setIsResultsVisible(isVisible);
  }, []);

  // Memoized derived state
  const hasResults = useMemo(() => {
    return searchHints.length > 0 || results.length > 0;
  }, [searchHints.length, results.length]);

  return {
    searchTerm,
    searchHints,
    results,
    isLoading,
    isAuthenticating,
    isLoadingMore,
    tokenError,
    hasResults,
    isResultsVisible,
    showAllResults,
    inputRef,
    handleHintSelect,
    handleLoadMore,
    handleClearSearch,
    handleResultsVisibility,
    setShowAllResults,
    setSearchTerm,
    trackFocus,
    setSearchHints,
    setResults,
    setIsResultsVisible,
  };
}; 