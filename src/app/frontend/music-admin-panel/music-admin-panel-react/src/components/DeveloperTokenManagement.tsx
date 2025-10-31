import { useEffect } from "react";
import { useDeveloperToken } from "../hooks/useDeveloperToken";
import { useTokenVisibility } from "../hooks/useTokenVisibility";
import { TokenDisplay } from "./TokenDisplay";
import { SubmitButton } from "./SubmitButton";
import "./DeveloperTokenManagement.css";

interface DeveloperTokenManagementProps {
  onTokenFetched: (token: string) => void;
}

export function DeveloperTokenManagement({
  onTokenFetched,
}: DeveloperTokenManagementProps) {
  const { token, isLoading, error, lastFetched, fetchToken, formatTimestamp } =
    useDeveloperToken();
  const { isTokenVisible, toggleTokenVisibility, hideToken } = useTokenVisibility();

  // Call onTokenFetched when token is loaded (either auto-loaded or manually fetched)
  useEffect(() => {
    if (token) {
      onTokenFetched(token);
    }
  }, [token, onTokenFetched]);

  const handleFetchToken = async () => {
    await fetchToken();
    hideToken(); // Hide token when fetching a new one
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      alert("Developer Token copied to clipboard!");
    }
  };

  return (
    <div className="content-card developer-token-card">
      <h2>Apple Developer Token Management</h2>

      {error && <div className="error-message">{error}</div>}

      {lastFetched && (
        <p className="token-info">
          Last fetched at: {formatTimestamp(lastFetched)}
        </p>
      )}

      <TokenDisplay
        token={token}
        label="Developer Token"
        isTokenVisible={isTokenVisible}
        onToggleVisibility={toggleTokenVisibility}
        onCopy={copyToken}
        isLoading={false}
      />

      <div className="button-container">
        <SubmitButton
          onClick={handleFetchToken}
          isLoading={isLoading}
          loadingText="Fetching Token..."
        >
          Fetch Developer Token
        </SubmitButton>
      </div>
    </div>
  );
}
