import { useDeveloperToken } from '../hooks/useDeveloperToken';
import './DeveloperTokenManagement.css';

interface DeveloperTokenManagementProps {
    onTokenFetched: (token: string) => void;
}

export function DeveloperTokenManagement({ onTokenFetched }: DeveloperTokenManagementProps) {
    const { token, isLoading, error, lastFetched, fetchToken, formatTimestamp } = useDeveloperToken();

    const handleFetchToken = async () => {
        try {
            const newToken = await fetchToken();
            onTokenFetched(newToken);
        } catch (err) {
            // Error handling is already done in the hook
        }
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
                    <pre>{token}</pre>
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