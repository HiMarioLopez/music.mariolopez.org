import React, { useState } from "react";
import { useSongLimit } from "../hooks/useSongLimit";
import { useStatusFade } from "../hooks/useStatusFade";
import { TokenDisplay } from "./TokenDisplay";
import { RefreshButton } from "./RefreshButton";
import { SubmitButton } from "./SubmitButton";
import { StatusMessage } from "./StatusMessage";
import "./SSMParameterCard.css";

export const AppleSongLimitCard: React.FC = () => {
  const [{ value, status, isLoading }, { setValue, handleUpdate, refresh }] =
    useSongLimit();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldFadeOut = useStatusFade(status);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await handleUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-card schedule-card">
      <h2>Update Apple Music History Song Limit Configuration</h2>

      <TokenDisplay
        token={null}
        label="Current Song Limit"
        isTokenVisible={false}
        onToggleVisibility={() => {}}
        isLoading={isLoading}
        loadingText="Loading..."
        displayValue={isLoading ? undefined : String(value)}
        actionButton={
          <RefreshButton
            onClick={refresh}
            isLoading={isLoading}
            title="Refresh song limit"
          />
        }
      />

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
        <SubmitButton
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Updating..."
        >
          Update Song Limit
        </SubmitButton>

        <StatusMessage status={status} shouldFadeOut={shouldFadeOut} />
      </div>
    </div>
  );
};
