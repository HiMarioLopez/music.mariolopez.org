import React from 'react';
import { RateUnit, useScheduleRate } from '../hooks/useScheduleRate';
import './ScheduleRateCard.css';

export const ScheduleRateCard: React.FC = () => {
    const [
        { rateType, value, unit, cronExpression, status, isLoading },
        { setRateType, setValue, setUnit, setCronExpression, handleUpdate }
    ] = useScheduleRate();

    return (
        <div className="content-card schedule-card">
            <h2>History Tracking Schedule</h2>

            <div className="token-display">
                <div className="secure-token-container">
                    <div className="token-header">
                        <span className="token-label">Current Schedule</span>
                    </div>
                    <pre className="clickable-token">
                        {isLoading
                            ? "Loading..."
                            : rateType === 'simple'
                                ? `rate(${value} ${unit})`
                                : `cron(${cronExpression})`}
                    </pre>
                </div>
            </div>

            {!isLoading && (
                <div className="schedule-controls">
                    <div className="select-container">
                        <label htmlFor="rate-type">Rate Type</label>
                        <select
                            id="rate-type"
                            value={rateType}
                            onChange={(e) => setRateType(e.target.value as 'simple' | 'cron')}
                        >
                            <option value="simple">Simple Rate</option>
                            <option value="cron">Cron Expression</option>
                        </select>
                    </div>

                    {rateType === 'simple' ? (
                        <div className="simple-rate-inputs">
                            <div className="input-container">
                                <label htmlFor="value">Value</label>
                                <input
                                    id="value"
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                            </div>
                            <div className="select-container">
                                <label htmlFor="unit">Unit</label>
                                <select
                                    id="unit"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value as RateUnit)}
                                >
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
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
                <button onClick={handleUpdate} className="primary-button">
                    Update Schedule
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