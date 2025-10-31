import React, { useState } from "react";
import {
  RateUnit,
  useSpotifyScheduleRate,
} from "../hooks/useSpotifyScheduleRate";
import { useStatusFade } from "../hooks/useStatusFade";
import { TokenDisplay } from "./TokenDisplay";
import { RefreshButton } from "./RefreshButton";
import { SubmitButton } from "./SubmitButton";
import { StatusMessage } from "./StatusMessage";
import "./SSMParameterCard.css";

const UNIT_OPTIONS = [
  { value: "minute", label: "Minute", plural: "minutes" },
  { value: "hour", label: "Hour", plural: "hours" },
  { value: "day", label: "Day", plural: "days" },
] as const;

export const SpotifyScheduleRateCard: React.FC = () => {
  const [
    { rateType, value, unit, cronExpression, status, isLoading },
    {
      setRateType,
      setValue,
      setUnit,
      setCronExpression,
      handleUpdate,
      refresh,
    },
  ] = useSpotifyScheduleRate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldFadeOut = useStatusFade(status);

  // Helper to determine if we should use singular or plural form
  const getUnitOptions = () => {
    const numValue = parseInt(value, 10);
    return UNIT_OPTIONS.map((option) => ({
      value: numValue === 1 ? option.value : option.plural,
      label: option.label + (numValue === 1 ? "" : "s"),
    }));
  };

  // Update unit when value changes between 1 and other numbers
  const handleValueChange = (newValue: string) => {
    setValue(newValue);

    // Find current unit's base form
    const currentBase = UNIT_OPTIONS.find(
      (opt) => opt.value === unit || opt.plural === unit
    );

    if (currentBase) {
      const numValue = parseInt(newValue, 10);
      setUnit(
        numValue === 1 ? currentBase.value : (currentBase.plural as RateUnit)
      );
    }
  };

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
      <h2>Update Spotify History Job Schedule</h2>

      <TokenDisplay
        token={null}
        label="Current Schedule"
        isTokenVisible={false}
        onToggleVisibility={() => {}}
        isLoading={isLoading}
        loadingText="Loading..."
        displayValue={
          isLoading
            ? undefined
            : rateType === "simple"
            ? `rate(${value} ${unit})`
            : `cron(${cronExpression})`
        }
        actionButton={
          <RefreshButton
            onClick={refresh}
            isLoading={isLoading}
            title="Refresh schedule rate"
          />
        }
      />

      {!isLoading && (
        <div className="schedule-controls">
          <div className="select-container">
            <label htmlFor="rate-type">Rate Type</label>
            <select
              id="rate-type"
              value={rateType}
              onChange={(e) => setRateType(e.target.value as "simple" | "cron")}
            >
              <option value="simple">Simple Rate</option>
              <option value="cron">Cron Expression</option>
            </select>
          </div>

          {rateType === "simple" ? (
            <div className="simple-rate-inputs">
              <div className="input-container">
                <label htmlFor="value">Value</label>
                <input
                  id="value"
                  type="number"
                  min="1"
                  value={value}
                  onChange={(e) => handleValueChange(e.target.value)}
                />
              </div>
              <div className="select-container">
                <label htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as RateUnit)}
                >
                  {getUnitOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="input-container">
              <label htmlFor="cron">Cron Expression</label>
              <input
                id="cron"
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="e.g., 0 */1 * * ? * (every hour)"
              />
            </div>
          )}
        </div>
      )}

      <div className="button-container">
        <SubmitButton
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Updating..."
        >
          Update Schedule
        </SubmitButton>

        <StatusMessage status={status} shouldFadeOut={shouldFadeOut} />
      </div>
    </div>
  );
};
