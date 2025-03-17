import { useTokenManagement } from '../hooks/useTokenManagement';
import './AdminPanel.css';

export function AdminPanel() {
  const {
    isAuthorized,
    musicUserToken,
    tokenInfo,
    handleAuthorize,
    handleLogout,
    handleRefreshToken,
    handleCopyToken,
    formatTimestamp,
  } = useTokenManagement();

  return (
    <div className="container">
      <h1>Music Admin Panel</h1>

      <div className="auth-status">
        <p>
          <strong>Authentication Status: </strong>
          <span className={isAuthorized ? 'status-authorized' : 'status-unauthorized'}>
            {isAuthorized ? 'Authorized' : 'Not Authorized'}
          </span>
        </p>

        <button onClick={isAuthorized ? handleLogout : handleAuthorize}>
          {isAuthorized ? 'Logout' : 'Authorize with Apple Music'}
        </button>

        {isAuthorized && musicUserToken && (
          <div className="token-section">
            <p><strong>Music User Token:</strong></p>
            {tokenInfo.timestamp && (
              <p>
                <small>
                  Token obtained at: {formatTimestamp(tokenInfo.timestamp)}
                </small>
              </p>
            )}
            <pre className="token-display">
              {musicUserToken}
            </pre>
            <div className="button-container">
              <button onClick={handleCopyToken}>
                Copy Token
              </button>
              <button onClick={handleRefreshToken}>
                Refresh Token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 