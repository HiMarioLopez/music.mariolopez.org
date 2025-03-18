import { useState } from 'react';
import { useMusicUserToken } from '../hooks/useMusicUserToken';
import './MusicUserTokenManagement.css';

export function MusicUserTokenManagement() {
    const {
        isAuthorized,
        musicUserToken,
        tokenInfo,
        handleAuthorize,
        handleLogout,
        handleRefreshToken,
        handleCopyToken,
        formatTimestamp
    } = useMusicUserToken();
    const [isTokenVisible, setIsTokenVisible] = useState(false);

    const toggleTokenVisibility = () => {
        setIsTokenVisible(!isTokenVisible);
    };

    // Function to mask the token, showing only the first 10 characters
    const getMaskedToken = (fullToken: string) => {
        if (!fullToken) return '';
        const visiblePart = fullToken.substring(0, 10);
        const maskedPart = '••••••••••••••••••••••••••••••••••••';
        return visiblePart + maskedPart;
    };

    return (
        <div className="content-card">
            <h2>Apple Music User Token Management</h2>

            <div className="auth-status">
                <p>
                    <strong>Authorization Status: </strong>
                    <span className={isAuthorized ? 'status-authorized' : 'status-unauthorized'}>
                        {isAuthorized ? 'Authorized' : 'Not Authorized'}
                    </span>
                </p>
            </div>

            {tokenInfo.timestamp && (
                <p className="token-warning">
                    Token obtained at: {formatTimestamp(tokenInfo.timestamp)}
                </p>
            )}

            <div className="token-display">
                {musicUserToken ? (
                    <div className="secure-token-container">
                        <div className="token-header">
                            <span className="token-label">User Token</span>
                            <button
                                onClick={toggleTokenVisibility}
                                className="toggle-visibility-btn"
                            >
                                {isTokenVisible ? 'Hide Token' : 'Show Token'}
                            </button>
                        </div>
                        <pre
                            onClick={handleCopyToken}
                            title="Click to copy token"
                            className="clickable-token"
                        >
                            {isTokenVisible ? musicUserToken : getMaskedToken(musicUserToken)}
                        </pre>
                    </div>
                ) : (
                    <p>No token available</p>
                )}
            </div>

            <div className="button-container">
                {!isAuthorized ? (
                    <button onClick={handleAuthorize} className="primary-button">
                        Authorize with Apple Music
                    </button>
                ) : (
                    <>
                        <button onClick={handleRefreshToken} className="primary-button">
                            Refresh Token
                        </button>
                        <button onClick={handleLogout} className="primary-button">
                            Logout from Apple Music
                        </button>
                    </>
                )}
            </div>
        </div>
    );
} 