import { useState, useEffect } from 'react';
import { useAppleMusic } from '../contexts/AppleMusicContext';

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

export function useTokenManagement(): TokenManagement {
  const { isAuthorized, musicUserToken, authorize, logout } = useAppleMusic();
  const [timestamp, setTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    if (musicUserToken) {
      setTimestamp(new Date());
      // Store token in backend
      fetch('https://admin.music.mariolopez.org/api/mut/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ musicUserToken }),
      }).catch(error => {
        console.error('Error storing token:', error);
        alert('Failed to store token in backend. Please try again.');
      });
    } else {
      setTimestamp(null);
    }
  }, [musicUserToken]);

  const handleCopyToken = () => {
    if (musicUserToken) {
      navigator.clipboard.writeText(musicUserToken);
      alert('Token copied to clipboard!');
    }
  };

  const handleRefreshToken = async () => {
    await logout();
    await authorize();
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
    handleLogout: logout,
    handleRefreshToken,
    handleCopyToken,
    formatTimestamp,
  };
} 