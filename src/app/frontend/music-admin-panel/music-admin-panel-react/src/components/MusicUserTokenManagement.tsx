import { useMusicUserToken } from "../hooks/useMusicUserToken";
import { useTokenVisibility } from "../hooks/useTokenVisibility";
import { TokenDisplay } from "./TokenDisplay";
import { SubmitButton } from "./SubmitButton";
import "./MusicUserTokenManagement.css";

export function MusicUserTokenManagement() {
  const {
    isAuthorized,
    musicUserToken,
    tokenInfo,
    handleAuthorize,
    handleLogout,
    handleRefreshToken,
    handleCopyToken,
    formatTimestamp,
  } = useMusicUserToken();
  const { isTokenVisible, toggleTokenVisibility } = useTokenVisibility();

  return (
    <div className="content-card">
      <h2>Apple Music User Token Management</h2>

      <div className="auth-status">
        <p>
          <strong>Authorization Status: </strong>
          <span
            className={
              isAuthorized ? "status-authorized" : "status-unauthorized"
            }
          >
            {isAuthorized ? "Authorized" : "Not Authorized"}
          </span>
        </p>
      </div>

      {tokenInfo.timestamp && (
        <p className="token-warning">
          Token obtained at: {formatTimestamp(tokenInfo.timestamp)}
        </p>
      )}

      <TokenDisplay
        token={musicUserToken}
        label="User Token"
        isTokenVisible={isTokenVisible}
        onToggleVisibility={toggleTokenVisibility}
        onCopy={handleCopyToken}
        isLoading={false}
      />

      <div className="button-container">
        {!isAuthorized ? (
          <SubmitButton onClick={handleAuthorize}>
            Authorize with Apple Music
          </SubmitButton>
        ) : (
          <>
            <SubmitButton onClick={handleRefreshToken}>
              Refresh Token
            </SubmitButton>
            <SubmitButton onClick={handleLogout}>
              Logout from Apple Music
            </SubmitButton>
          </>
        )}
      </div>
    </div>
  );
}
