import React, { ReactNode } from 'react';

interface TokenDisplayProps {
  token: string | null;
  label: string;
  isTokenVisible: boolean;
  onToggleVisibility: () => void;
  onCopy?: () => void;
  isLoading?: boolean;
  loadingText?: string;
  displayValue?: string; // Optional override for display value (for non-token displays)
  actionButton?: ReactNode; // Optional action button (e.g., refresh button)
}

/**
 * Reusable component for displaying tokens with visibility toggle and copy functionality
 */
export function TokenDisplay({
  token,
  label,
  isTokenVisible,
  onToggleVisibility,
  onCopy,
  isLoading = false,
  loadingText = "Loading...",
  displayValue,
  actionButton,
}: TokenDisplayProps) {
  const getMaskedToken = (fullToken: string): string => {
    if (!fullToken) return "";
    const visiblePart = fullToken.substring(0, 10);
    const maskedPart = "••••••••••••••••••••••••••••••••••••";
    return visiblePart + maskedPart;
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else if (token) {
      navigator.clipboard.writeText(token);
      alert(`${label} copied to clipboard!`);
    }
  };

  const displayText = displayValue 
    ? displayValue 
    : isLoading 
    ? loadingText 
    : token 
    ? (isTokenVisible ? token : getMaskedToken(token))
    : "No token available";

  return (
    <div className="token-display">
      {token || displayValue ? (
        <div className="secure-token-container">
          <div className="token-header">
            <span className="token-label">{label}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {actionButton}
              {token && (
                <button
                  onClick={onToggleVisibility}
                  className="toggle-visibility-btn"
                >
                  {isTokenVisible ? "Hide Token" : "Show Token"}
                </button>
              )}
            </div>
          </div>
          <pre
            onClick={token ? handleCopy : undefined}
            title={token ? "Click to copy token" : undefined}
            className={token ? "clickable-token" : "token-display-text"}
          >
            {displayText}
          </pre>
        </div>
      ) : (
        <p>No token available</p>
      )}
    </div>
  );
}

