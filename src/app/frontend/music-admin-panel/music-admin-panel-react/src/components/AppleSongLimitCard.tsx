import React, { useState, useEffect, useRef } from "react";
import { useSongLimit } from "../hooks/useSongLimit";
import "./SSMParameterCard.css"; // Reusing the same styles from ScheduleRateCard.tsx

export const AppleSongLimitCard: React.FC = () => {
  const [{ value, status, isLoading }, { setValue, handleUpdate, refresh }] =
    useSongLimit();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const statusTimeoutRef = useRef<number | null>(null);

  // Clear any existing timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // Set up fade-out effect when status changes
  useEffect(() => {
    if (status) {
      // Reset fade state
      setShouldFadeOut(false);

      // Clear any existing timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }

      // Set timeout to fade out after 5 seconds
      statusTimeoutRef.current = window.setTimeout(() => {
        setShouldFadeOut(true);
      }, 3000);
    }
  }, [status]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Reset fade state if there was a previous status
    setShouldFadeOut(false);
    try {
      await handleUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-card schedule-card">
      <h2>Update Apple Music History Song Limit Configuration</h2>

      <div className="token-display">
        <div className="secure-token-container">
          <div className="token-header">
            <span className="token-label">Current Song Limit</span>
            <button
              className={`refresh-button ${isLoading ? "spinning" : ""}`}
              onClick={refresh}
              disabled={isLoading}
              title="Refresh song limit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
            <label htmlFor="song-limit">Number of Songs to Fetch</label>
            <input
              id="song-limit"
              type="number"
              min="5"
              max="30"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value, 10))}
            />
            <small style={{ color: "var(--text-secondary)" }}>
              Enter a value between 5 and 30
            </small>
          </div>
        </div>
      )}

      <div className="button-container">
        <button
          onClick={handleSubmit}
          className={`primary-button ${isSubmitting ? "loading" : ""}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Updating...
            </>
          ) : (
            "Update Song Limit"
          )}
        </button>

        {status && (
          <div
            className={`status-message ${
              status.includes("Error") ? "error" : "success"
            } ${shouldFadeOut ? "fade-out" : ""}`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};
