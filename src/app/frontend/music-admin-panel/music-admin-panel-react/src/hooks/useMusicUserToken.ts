import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppleMusic } from '../contexts/AppleMusicContext';
import { getMusicUserTokenStatus, type MusicUserTokenStatusResponse } from '../utils/api';

interface TokenInfo {
  timestamp: Date | null;
}

interface TokenManagement {
  isAuthorized: boolean;
  musicUserToken: string | null;
  tokenInfo: TokenInfo;
  handleAuthorize: () => Promise<void>;
  handleLogout: () => void;
  handleRefreshToken: () => Promise<void>;
  handleCopyToken: () => void;
  formatTimestamp: (date: Date) => string;
}

export function useMusicUserToken(): TokenManagement {
  const { isAuthorized: contextAuthorized, musicUserToken: contextToken, authorize, logout } = useAppleMusic();
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [musicUserToken, setMusicUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevContextAuthorized = useRef(contextAuthorized);

  // Check status from Parameter Store
  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: MusicUserTokenStatusResponse = await getMusicUserTokenStatus();
      
      if (response.authorized && response.musicUserToken) {
        setIsAuthorized(true);
        setMusicUserToken(response.musicUserToken);
        // If context doesn't have the token, update it
        if (!contextToken) {
          // Token exists in Parameter Store but not in context - sync it
        }
      } else {
        setIsAuthorized(false);
        setMusicUserToken(null);
      }
    } catch (error) {
      console.error('Error checking Apple Music token status:', error);
      setIsAuthorized(false);
      setMusicUserToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [contextToken]);

  // Initial status check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Sync with context when it changes (e.g., after authorization)
  useEffect(() => {
    // If context is authorized, always sync
    if (contextAuthorized && contextToken) {
      setIsAuthorized(true);
      setMusicUserToken(contextToken);
    } 
    // Only wipe local state if context explicitly transitioned from authorized -> not authorized (logout)
    else if (prevContextAuthorized.current && !contextAuthorized) {
      // Only update if we're not loading to avoid race conditions
      if (!isLoading) {
        setIsAuthorized(false);
        setMusicUserToken(null);
      }
    }
    
    prevContextAuthorized.current = contextAuthorized;
  }, [contextAuthorized, contextToken, isLoading]);

  useEffect(() => {
    if (musicUserToken) {
      setTimestamp(new Date());
    } else {
      setTimestamp(null);
    }
  }, [musicUserToken]);

  const handleCopyToken = () => {
    if (musicUserToken) {
      navigator.clipboard.writeText(musicUserToken);
      alert('Music User Token copied to clipboard!');
    }
  };

  const handleRefreshToken = async () => {
    logout();
    setIsAuthorized(false);
    setMusicUserToken(null);
    await authorize();
    // Status will be refreshed after authorization completes
    setTimeout(() => {
      checkStatus();
    }, 1000);
  };

  const handleLogout = async () => {
    logout();
    setIsAuthorized(false);
    setMusicUserToken(null);
    // Refresh status to reflect logout
    await checkStatus();
  };

  const formatTimestamp = (date: Date) => {
    return `${date.toLocaleTimeString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
  };

  return {
    isAuthorized,
    musicUserToken,
    tokenInfo: {
      timestamp,
    },
    handleAuthorize: authorize,
    handleLogout,
    handleRefreshToken,
    handleCopyToken,
    formatTimestamp,
  };
} 