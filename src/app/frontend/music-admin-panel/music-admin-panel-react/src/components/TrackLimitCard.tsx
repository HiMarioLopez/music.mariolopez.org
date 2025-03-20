import React from 'react';
import { useTrackLimit } from '../hooks/useTrackLimit';
import './ScheduleRateCard.css'; // Reusing the same styles from ScheduleRateCard.tsx

export const TrackLimitCard: React.FC = () => {
    const [
        { value, status, isLoading },
        { setValue, handleUpdate, refresh }
    ] = useTrackLimit();

    return (
        <div className="content-card schedule-card">
            <h2>Track Limit Configuration</h2>

            <div className="token-display">
                <div className="secure-token-container">
                    <div className="token-header">
                        <span className="token-label">Current Track Limit</span>
                        <button
                            className={`refresh-button ${isLoading ? 'spinning' : ''}`}
                            onClick={refresh}
                            disabled={isLoading}
                            title="Refresh track limit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6"></path>
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                <path d="M3 22v-6h6"></path>
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                        </button>
                    </div>
                    <pre className="clickable-token">
                        {isLoading ? "Loading..." : value}
                    </pre>
                </div>
            </div>

            {!isLoading && (
                <div className="schedule-controls">
                    <div className="input-container">
                        <label htmlFor="track-limit">Number of Tracks to Fetch</label>
                        <input
                            id="track-limit"
                            type="number"
                            min="1"
                            max="30"
                            value={value}
                            onChange={(e) => setValue(parseInt(e.target.value, 10))}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>
                            Enter a value between 1 and 30
                        </small>
                    </div>
                </div>
            )}

            <div className="button-container">
                <button onClick={handleUpdate} className="primary-button">
                    Update Track Limit
                </button>
            </div>

            {status && (
                <div className={`status-message ${status.includes('Error') ? 'error' : 'success'}`}>
                    {status}
                </div>
            )}
        </div>
    );
}; 