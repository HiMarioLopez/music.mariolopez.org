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

export function useMusicUserToken(): TokenManagement {
  const { isAuthorized, musicUserToken, authorize, logout } = useAppleMusic();
  const [timestamp, setTimestamp] = useState<Date | null>(null);

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