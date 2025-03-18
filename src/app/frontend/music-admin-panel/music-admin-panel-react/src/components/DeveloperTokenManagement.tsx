import { useState } from 'react';
import { useDeveloperToken } from '../hooks/useDeveloperToken';
import './DeveloperTokenManagement.css';

interface DeveloperTokenManagementProps {
    onTokenFetched: (token: string) => void;
}

export function DeveloperTokenManagement({ onTokenFetched }: DeveloperTokenManagementProps) {
    const { token, isLoading, error, lastFetched, fetchToken, formatTimestamp } = useDeveloperToken();
    const [isTokenVisible, setIsTokenVisible] = useState(false);

    const handleFetchToken = async () => {
        try {
            const newToken = await fetchToken();
            onTokenFetched(newToken);
            setIsTokenVisible(false); // Hide token when fetching a new one
        } catch (err) {
            // Error handling is already done in the hook
        }
    };

    const toggleTokenVisibility = () => {
        setIsTokenVisible(!isTokenVisible);
    };

    const copyToken = () => {
        if (token) {
            navigator.clipboard.writeText(token);
            alert('Developer Token copied to clipboard!');
        }
    };

    // Function to mask the token, showing only the first 10 characters
    const getMaskedToken = (fullToken: string) => {
        if (!fullToken) return '';
        const visiblePart = fullToken.substring(0, 10);
        const maskedPart = '••••••••••••••••••••••••••••••••••••';
        return visiblePart + maskedPart;
    };

    return (
        <div className="content-card developer-token-card">
            <h2>Apple Developer Token</h2>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {lastFetched && (
                <p className="token-info">
                    Last fetched at: {formatTimestamp(lastFetched)}
                </p>
            )}

            <div className="token-display">
                {token ? (
                    <div className="secure-token-container">
                        <div className="token-header">
                            <span className="token-label">Developer Token</span>
                            <button
                                onClick={toggleTokenVisibility}
                                className="toggle-visibility-btn"
                            >
                                {isTokenVisible ? 'Hide Token' : 'Show Token'}
                            </button>
                        </div>
                        <pre
                            onClick={copyToken}
                            title="Click to copy token"
                            className="clickable-token"
                        >
                            {isTokenVisible ? token : getMaskedToken(token)}
                        </pre>
                    </div>
                ) : (
                    <p>No token available</p>
                )}
            </div>

            <div className="button-container">
                <button
                    onClick={handleFetchToken}
                    className="primary-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Fetching Token...' : 'Fetch Developer Token'}
                </button>
            </div>
        </div>
    );
} 