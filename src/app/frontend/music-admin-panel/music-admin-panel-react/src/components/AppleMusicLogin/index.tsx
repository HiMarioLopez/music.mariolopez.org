import { useState } from 'react';
import './index.css';
import AppleMusicService from '../../services/AppleMusicService';

export function AppleMusicAuthStatus() {
    const [isOperationPending, setIsOperationPending] = useState(false);

    // Mock data
    const userToken = 'mock-user-token';
    const retrievedAt = new Date().toLocaleString();

    const handleRefreshToken = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();

        const confirmed = window.confirm('Are you sure you want to refresh the user token?');
        if (!confirmed) {
            return;
        }

        setIsOperationPending(true);

        try {
            const userToken = await AppleMusicService.getInstance().login();
            if (userToken) {
                // Handle successful login, e.g., update user token in state or local storage
                console.log('User token:', userToken);
            }
            setTimeout(() => {
                setIsOperationPending(false);
            }, 1000);
        }
        catch {
            setIsOperationPending(false);
        }
    };

    const handleClearToken = (event: { preventDefault: () => void; }) => {
        event.preventDefault();

        const confirmed = window.confirm('Are you sure you want to clear the user token?');
        if (!confirmed) {
            return;
        }

        setIsOperationPending(true);

        try {
            // todo: logic to clear user token

            // wait 1 second
            setTimeout(() => {
                setIsOperationPending(false);
            }, 1000);
        }
        catch {
            setIsOperationPending(false);
        }
    };

    return (
        <div className="apple-music-auth-status-component styled-container">
            <h1>Apple Music Auth Status</h1>
            <p>
                <strong>Status:</strong> {userToken ? 'Logged In' : 'Logged Out'}
            </p>
            <p>
                <strong>Current Token:</strong> {userToken || 'N/A'}
            </p>
            <p>
                <strong>Retrieved At:</strong> {retrievedAt || 'N/A'}
            </p>
            <button className="login-button" onClick={handleRefreshToken} disabled={isOperationPending}>
                Refresh User Token
            </button>
            <button className="clear-token-button" onClick={handleClearToken} disabled={isOperationPending}>
                Delete User Token
            </button>
        </div>
    );
}