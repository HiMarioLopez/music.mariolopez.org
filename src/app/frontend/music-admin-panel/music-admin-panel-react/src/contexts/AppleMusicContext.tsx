import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppleMusicContextType {
  isAuthorized: boolean;
  musicUserToken: string | null;
  authorize: () => Promise<void>;
  logout: () => void;
}

const AppleMusicContext = createContext<AppleMusicContextType | undefined>(undefined);

export function AppleMusicProvider({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [musicUserToken, setMusicUserToken] = useState<string | null>(null);
  const [musicKit, setMusicKit] = useState<MusicKit.MusicKitInstance | null>(null);

  useEffect(() => {
    // Initialize MusicKit when the component mounts
    const initializeMusicKit = async () => {
      try {
        await MusicKit.configure({
          developerToken: import.meta.env.VITE_APPLE_DEVELOPER_TOKEN,
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
  }, []);

  const authorize = async () => {
    if (!musicKit) return;

    try {
      await musicKit.authorize();
      setIsAuthorized(true);
      setMusicUserToken(musicKit.musicUserToken);

      // Send MUT to your backend
      if (musicKit.musicUserToken) {
        try {
          await fetch('/api/store-mut', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              musicUserToken: musicKit.musicUserToken,
            }),
          });
        } catch (error) {
          console.error('Error storing MUT:', error);
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
        authorize,
        logout,
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