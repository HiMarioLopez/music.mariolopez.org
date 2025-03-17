import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { storeMusicUserToken } from '../utils/api';

interface AppleMusicContextType {
  isAuthorized: boolean;
  musicUserToken: string | null;
  developerToken: string | null;
  authorize: () => Promise<void>;
  logout: () => void;
  setDeveloperToken: (token: string) => void;
}

const AppleMusicContext = createContext<AppleMusicContextType | undefined>(undefined);

export function AppleMusicProvider({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [musicUserToken, setMusicUserToken] = useState<string | null>(null);
  const [developerToken, setDeveloperToken] = useState<string | null>(null);
  const [musicKit, setMusicKit] = useState<MusicKit.MusicKitInstance | null>(null);

  useEffect(() => {
    // Initialize MusicKit when the component mounts
    const initializeMusicKit = async () => {
      try {
        if (!developerToken) {
          console.log('Waiting for developer token...');
          return;
        }

        await MusicKit.configure({
          developerToken,
          app: {
            name: 'Music Admin Panel',
            build: '1.0.0',
          },
        });
        const instance = MusicKit.getInstance();
        setMusicKit(instance);

        // Check if user is already authorized
        if (instance.isAuthorized) {
          setIsAuthorized(true);
          setMusicUserToken(instance.musicUserToken);
        }
      } catch (error) {
        console.error('Error initializing MusicKit:', error);
      }
    };

    initializeMusicKit();
  }, [developerToken]);

  const authorize = async () => {
    if (!musicKit) return;

    try {
      await musicKit.authorize();
      setIsAuthorized(true);
      setMusicUserToken(musicKit.musicUserToken);

      // Store MUT in backend
      if (musicKit.musicUserToken) {
        try {
          await storeMusicUserToken(musicKit.musicUserToken);
        } catch (error) {
          console.error('Error storing MUT:', error);
          alert('Failed to store token in backend. Please try again.');
        }
      }
    } catch (error) {
      console.error('Authorization error:', error);
    }
  };

  const logout = () => {
    if (!musicKit) return;

    try {
      musicKit.unauthorize();
      setIsAuthorized(false);
      setMusicUserToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppleMusicContext.Provider
      value={{
        isAuthorized,
        musicUserToken,
        developerToken,
        authorize,
        logout,
        setDeveloperToken,
      }}
    >
      {children}
    </AppleMusicContext.Provider>
  );
}

export function useAppleMusic() {
  const context = useContext(AppleMusicContext);
  if (context === undefined) {
    throw new Error('useAppleMusic must be used within an AppleMusicProvider');
  }
  return context;
} 