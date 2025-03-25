import React, { useState, useEffect, useRef } from 'react';
import { RateUnit, useScheduleRate } from '../hooks/useScheduleRate';
import './ScheduleRateCard.css';

const UNIT_OPTIONS = [
    { value: 'minute', label: 'Minute', plural: 'minutes' },
    { value: 'hour', label: 'Hour', plural: 'hours' },
    { value: 'day', label: 'Day', plural: 'days' },
] as const;

export const ScheduleRateCard: React.FC = () => {
    const [
        { rateType, value, unit, cronExpression, status, isLoading },
        { setRateType, setValue, setUnit, setCronExpression, handleUpdate, refresh }
    ] = useScheduleRate();
    
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

    // Helper to determine if we should use singular or plural form
    const getUnitOptions = () => {
        const numValue = parseInt(value, 10);
        return UNIT_OPTIONS.map(option => ({
            value: numValue === 1 ? option.value : option.plural,
            label: option.label + (numValue === 1 ? '' : 's')
        }));
    };

    // Update unit when value changes between 1 and other numbers
    const handleValueChange = (newValue: string) => {
        setValue(newValue);

        // Find current unit's base form
        const currentBase = UNIT_OPTIONS.find(
            opt => opt.value === unit || opt.plural === unit
        );

        if (currentBase) {
            const numValue = parseInt(newValue, 10);
            setUnit(numValue === 1 ? currentBase.value : currentBase.plural as RateUnit);
        }
    };
    
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
            <h2>History Tracking Schedule</h2>

            <div className="token-display">
                <div className="secure-token-container">
                    <div className="token-header">
                        <span className="token-label">Current Schedule</span>
                        <button
                            className={`refresh-button ${isLoading ? 'spinning' : ''}`}
                            onClick={refresh}
                            disabled={isLoading}
                            title="Refresh schedule rate"
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
                                    {getUnitOptions().map(option => (
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
                <button 
                    onClick={handleSubmit} 
                    className={`primary-button ${isSubmitting ? 'loading' : ''}`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner"></span>
                            Updating...
                        </>
                    ) : (
                        'Update Schedule'
                    )}
                </button>
                
                {status && (
                    <div className={`status-message ${status.includes('Error') ? 'error' : 'success'} ${shouldFadeOut ? 'fade-out' : ''}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
};