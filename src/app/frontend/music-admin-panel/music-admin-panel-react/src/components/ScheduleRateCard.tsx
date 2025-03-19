import React, { useState } from 'react';
import './ScheduleRateCard.css';
import { updateScheduleRate } from '../utils/api';

type RateUnit = 'minutes' | 'hours' | 'days';

export const ScheduleRateCard: React.FC = () => {
    const [rateType, setRateType] = useState<'simple' | 'cron'>('simple');
    const [value, setValue] = useState('5');
    const [unit, setUnit] = useState<RateUnit>('minutes');
    const [cronExpression, setCronExpression] = useState('');
    const [status, setStatus] = useState<string>('');

    const handleUpdate = async () => {
        try {
            const rate = rateType === 'simple'
                ? `rate(${value} ${unit})`
                : `cron(${cronExpression})`;

            await updateScheduleRate(rate);
            setStatus('Schedule rate updated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule rate';
            console.error('Error:', error);
            setStatus(`Error: ${errorMessage}`);
        }
    };

    return (
        <div className="content-card schedule-card">
            <h2>History Tracking Schedule</h2>

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

            <div className="button-container">
                <button
                    onClick={handleUpdate}
                    className="primary-button"
                >
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