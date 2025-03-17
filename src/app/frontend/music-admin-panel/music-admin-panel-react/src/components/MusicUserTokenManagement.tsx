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
                    <pre>{musicUserToken}</pre>
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
                        <button onClick={handleCopyToken} className="primary-button">
                            Copy Token
                        </button>
                    </>
                )}
            </div>
        </div>
    );
} 