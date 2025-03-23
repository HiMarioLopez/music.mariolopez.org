import React, { useCallback, useEffect, useState } from 'react';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import RealtimeStats from './RealtimeStats';
import './RealtimeUpdatesCard.styles.css';

const RealtimeUpdatesCard: React.FC = () => {
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const { isRunning, stopSimulation } = useRealTimeUpdates(realTimeEnabled);

  // Use an effect to ensure the simulation is properly stopped
  useEffect(() => {
    if (!realTimeEnabled && isRunning) {
      stopSimulation();
    }
  }, [realTimeEnabled, isRunning, stopSimulation]);

  const toggleRealTimeUpdates = useCallback(() => {
    setRealTimeEnabled(prevState => {
      // If we're turning it off, explicitly call stopSimulation
      if (prevState) {
        stopSimulation();
      }
      return !prevState;
    });
  }, [stopSimulation]);

  // Only show Live indicator when both states are true
  const showLiveIndicator = realTimeEnabled && isRunning;

  return (
    <div className="realtime-updates-card styled-container">
      <h1>Synthetic Real-time Updates</h1>

      <div className="real-time-control">
        <button
          onClick={toggleRealTimeUpdates}
          className={`real-time-button ${realTimeEnabled ? 'active' : ''}`}
          aria-pressed={realTimeEnabled}
        >
          {realTimeEnabled ? 'Disable Real-time Updates' : 'Enable Real-time Updates'}
        </button>
        <div className="real-time-status">
          {showLiveIndicator && (
            <span className="real-time-indicator" aria-hidden="true">
              ● Live
            </span>
          )}
        </div>
      </div>

      {realTimeEnabled && <RealtimeStats />}

      {!realTimeEnabled && (
        <div className="realtime-instructions">
          <p>Enable real-time updates to see votes changing automatically.</p>
          <p>This simulates what would happen in a multi-user environment where different users are upvoting recommendations simultaneously.</p>
        </div>
      )}
    </div>
  );
};

export default RealtimeUpdatesCard; 