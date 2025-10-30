import { useState } from "react";
import { useSpotifyAuth } from "../hooks/useSpotifyAuth";
import "./SpotifyAuthManagement.css";

export function SpotifyAuthManagement() {
  const {
    isAuthorized,
    isLoading,
    message,
    accessToken,
    handleAuthorize,
    handleRefreshStatus,
    handleCopyToken,
  } = useSpotifyAuth();
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };

  // Function to mask the token, showing only the first 10 characters
  const getMaskedToken = (fullToken: string) => {
    if (!fullToken) return "";
    const visiblePart = fullToken.substring(0, 10);
    const maskedPart = "••••••••••••••••••••••••••••••••••••";
    return visiblePart + maskedPart;
  };

  return (
    <div className="content-card">
      <h2>Spotify Authorization Management</h2>

      <div className="auth-status">
        <p>
          <strong>Authorization Status: </strong>
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <span
              className={
                isAuthorized ? "status-authorized" : "status-unauthorized"
              }
            >
              {isAuthorized ? "Authorized" : "Not Authorized"}
            </span>
          )}
        </p>
        {message && <p className="message-text">{message}</p>}
      </div>

      <div className="token-display">
        {accessToken ? (
          <div className="secure-token-container">
            <div className="token-header">
              <span className="token-label">Access Token</span>
              <button
                onClick={toggleTokenVisibility}
                className="toggle-visibility-btn"
              >
                {isTokenVisible ? "Hide Token" : "Show Token"}
              </button>
            </div>
            <pre
              onClick={handleCopyToken}
              title="Click to copy token"
              className="clickable-token"
            >
              {isTokenVisible ? accessToken : getMaskedToken(accessToken)}
            </pre>
          </div>
        ) : (
          <p>No token available</p>
        )}
      </div>

      <div className="button-container">
        {!isAuthorized ? (
          <button
            onClick={handleAuthorize}
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Authorize with Spotify"}
          </button>
        ) : (
          <button
            onClick={handleRefreshStatus}
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Status"}
          </button>
        )}
      </div>

      <div className="info-section">
        <p>
          <strong>Scope:</strong> user-read-recently-played
        </p>
        <p>
          The access token is stored securely in AWS SSM Parameter Store and can
          be used by your public site to fetch recently played tracks.
        </p>
      </div>
    </div>
  );
}
