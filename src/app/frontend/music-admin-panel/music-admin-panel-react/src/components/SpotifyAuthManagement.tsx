import { useSpotifyAuth } from "../hooks/useSpotifyAuth";
import { useTokenVisibility } from "../hooks/useTokenVisibility";
import { TokenDisplay } from "./TokenDisplay";
import { SubmitButton } from "./SubmitButton";
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
  const { isTokenVisible, toggleTokenVisibility } = useTokenVisibility();

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

      <TokenDisplay
        token={accessToken}
        label="Access Token"
        isTokenVisible={isTokenVisible}
        onToggleVisibility={toggleTokenVisibility}
        onCopy={handleCopyToken}
        isLoading={false}
      />

      <div className="button-container">
        {!isAuthorized ? (
          <SubmitButton
            onClick={handleAuthorize}
            isLoading={isLoading}
            loadingText="Connecting..."
          >
            Authorize with Spotify
          </SubmitButton>
        ) : (
          <SubmitButton
            onClick={handleRefreshStatus}
            isLoading={isLoading}
            loadingText="Refreshing..."
          >
            Refresh Status
          </SubmitButton>
        )}
      </div>

      <div className="info-section">
        <p>
          <strong>Scope:</strong> user-read-recently-played
        </p>
      </div>
    </div>
  );
}
