import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAppleMusic } from '../contexts/AppleMusicContext';
import '../styles/components.css';
import '../styles/theme.css';
import './AdminPanel.css';
import { DeveloperTokenManagement } from './DeveloperTokenManagement';
import { MusicUserTokenManagement } from './MusicUserTokenManagement';
import { ThemeToggle } from './ThemeToggle';

export function AdminPanel() {
  const { setDeveloperToken } = useAppleMusic();

  return (
    <div className="auth-container">
      <Authenticator hideSignUp>
        {({ signOut, user }) => (
          <div className="admin-container">
            <nav className="admin-nav">
              <div className="nav-content">
                <div className="nav-header">
                  <h1 className="nav-title">Music Admin Panel</h1>
                  <span className="welcome-message">
                    Welcome, <span className="username">{user?.username}</span>
                  </span>
                </div>
                <div className="nav-actions">
                  <ThemeToggle />
                  <button onClick={signOut} className="primary-button">
                    Sign Out
                  </button>
                </div>
              </div>
            </nav>

            <main className="admin-main">
              <div className="admin-content">
                <DeveloperTokenManagement onTokenFetched={setDeveloperToken} />
                <MusicUserTokenManagement />
              </div>
            </main>
          </div>
        )}
      </Authenticator>
    </div>
  );
} 