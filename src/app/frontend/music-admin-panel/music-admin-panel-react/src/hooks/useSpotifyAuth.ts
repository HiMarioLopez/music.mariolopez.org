import { useState, useEffect, useCallback } from 'react';
import { getSpotifyOAuthUrl, getSpotifyStatus, getSpotifyToken, type SpotifyStatusResponse } from '../utils/api';

interface SpotifyAuthState {
  isAuthorized: boolean;
  isLoading: boolean;
  message: string;
  accessToken: string | null;
}

interface SpotifyAuthManagement {
  isAuthorized: boolean;
  isLoading: boolean;
  message: string;
  accessToken: string | null;
  handleAuthorize: () => Promise<void>;
  handleRefreshStatus: () => Promise<void>;
  handleCopyToken: () => void;
}

const SPOTIFY_STATE_KEY = 'spotify_oauth_state';

export function useSpotifyAuth(): SpotifyAuthManagement {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    isAuthorized: false,
    isLoading: true,
    message: 'Checking authorization status...',
    accessToken: null,
  });

  // Fetch token if authorized
  const fetchToken = useCallback(async () => {
    try {
      const response = await getSpotifyToken();
      return response.accessToken;
    } catch (error) {
      console.error('Error fetching Spotify token:', error);
      return null;
    }
  }, []);

  // Initial status check
  const checkStatus = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const response: SpotifyStatusResponse = await getSpotifyStatus();
      let accessToken = null;
      if (response.authorized) {
        accessToken = await fetchToken();
      }
      setAuthState({
        isAuthorized: response.authorized,
        isLoading: false,
        message: response.message,
        accessToken,
      });
    } catch (error) {
      console.error('Error checking Spotify status:', error);
      setAuthState({
        isAuthorized: false,
        isLoading: false,
        message: 'Failed to check authorization status',
        accessToken: null,
      });
    }
  }, [fetchToken]);

  // Check if we're returning from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyAuth = urlParams.get('spotify_auth');
    const error = urlParams.get('error');

    if (spotifyAuth === 'success') {
      // Authorization successful, refresh status
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        message: 'Authorization completed successfully!',
      }));
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh status after a brief delay
      setTimeout(() => {
        checkStatus();
      }, 500);
    } else if (spotifyAuth === 'error' || error) {
      // Authorization failed
      const errorMessage = error || 'Authorization failed';
      setAuthState({
        isAuthorized: false,
        isLoading: false,
        message: errorMessage,
        accessToken: null,
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // Clean up session storage if we have old entries
    const urlParamsOld = new URLSearchParams(window.location.search);
    if (!urlParamsOld.get('spotify_auth')) {
      sessionStorage.removeItem(SPOTIFY_STATE_KEY);
    }
  }, [checkStatus]);

  useEffect(() => {
    // Don't check status if we're in the middle of an OAuth callback or success redirect
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyAuth = urlParams.get('spotify_auth');
    if (!spotifyAuth) {
      checkStatus();
    }
  }, [checkStatus]);

  const handleAuthorize = useCallback(async () => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        message: 'Initiating authorization...',
      }));

      const response = await getSpotifyOAuthUrl();

      // Store state in sessionStorage for validation (though backend handles PKCE now)
      sessionStorage.setItem(SPOTIFY_STATE_KEY, response.state);

      // Redirect to Spotify authorization page
      window.location.href = response.authorization_url;
    } catch (error) {
      console.error('Error initiating Spotify authorization:', error);
      setAuthState({
        isAuthorized: false,
        isLoading: false,
        message: 'Failed to initiate authorization',
        accessToken: null,
      });
    }
  }, []);

  const handleCopyToken = useCallback(() => {
    if (authState.accessToken) {
      navigator.clipboard.writeText(authState.accessToken);
      alert('Spotify access token copied to clipboard!');
    }
  }, [authState.accessToken]);

  return {
    isAuthorized: authState.isAuthorized,
    isLoading: authState.isLoading,
    message: authState.message,
    accessToken: authState.accessToken,
    handleAuthorize,
    handleRefreshStatus: checkStatus,
    handleCopyToken,
  };
}

