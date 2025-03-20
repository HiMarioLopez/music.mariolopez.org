import { useState, useEffect } from 'react';
import { updateScheduleRate, getScheduleRate } from '../utils/api';

export type RateUnit = 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days';
type RateType = 'simple' | 'cron';

interface ScheduleRateState {
    rateType: RateType;
    value: string;
    unit: RateUnit;
    cronExpression: string;
    status: string;
    isLoading: boolean;
}

interface ScheduleRateActions {
    setRateType: (type: RateType) => void;
    setValue: (value: string) => void;
    setUnit: (unit: RateUnit) => void;
    setCronExpression: (expression: string) => void;
    handleUpdate: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useScheduleRate(): [ScheduleRateState, ScheduleRateActions] {
    const [rateType, setRateType] = useState<RateType>('simple');
    const [value, setValue] = useState('5');
    const [unit, setUnit] = useState<RateUnit>('minutes');
    const [cronExpression, setCronExpression] = useState('');
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchCurrentRate = async () => {
        try {
            setIsLoading(true);
            const response = await getScheduleRate();
            const rate = response.rate;

            if (rate.startsWith('rate(')) {
                setRateType('simple');
                const match = rate.match(/rate\((\d+)\s+(\w+)\)/);
                if (match) {
                    setValue(match[1]);
                    setUnit(match[2] as RateUnit);
                }
            } else if (rate.startsWith('cron(')) {
                setRateType('cron');
                const match = rate.match(/cron\((.*)\)/);
                if (match) {
                    setCronExpression(match[1]);
                }
            }
        } catch (error) {
            console.error('Error fetching schedule rate:', error);
            setStatus('Error: Failed to fetch current schedule rate');
        } finally {
            setIsLoading(false);
        }
    };

    const validateRateExpression = (value: string, unit: RateUnit): string | null => {
        const numValue = parseInt(value, 10);
        if (numValue <= 0) return "Rate value must be positive";

        if (numValue === 1 && unit.endsWith('s')) {
            return `For value 1, use '${unit.slice(0, -1)}' instead of '${unit}'`;
        }
        if (numValue > 1 && !unit.endsWith('s')) {
            return `For values greater than 1, use '${unit}s' instead of '${unit}'`;
        }
        return null;
    };

    const validateCronExpression = (cron: string): string | null => {
        const parts = cron.trim().split(/\s+/);
        if (parts.length !== 6) {
            return "Cron expression must have exactly 6 fields";
        }

        // Check for rates faster than 1 minute
        const minutes = parts[0];
        if (minutes !== '*' && parseInt(minutes, 10) < 1) {
            return "Cron expressions faster than 1 minute are not supported";
        }

        // Check if both day-of-month and day-of-week are specified
        const dayOfMonth = parts[2];
        const dayOfWeek = parts[4];
        if (dayOfMonth !== '?' && dayOfWeek !== '?') {
            return "Cannot specify both day-of-month and day-of-week. One must use '?'";
        }

        return null;
    };

    const handleUpdate = async () => {
        try {
            if (rateType === 'simple') {
                const error = validateRateExpression(value, unit);
                if (error) {
                    setStatus(`Error: ${error}`);
                    return;
                }
                await updateScheduleRate(`rate(${value} ${unit})`);
            } else {
                const error = validateCronExpression(cronExpression);
                if (error) {
                    setStatus(`Error: ${error}`);
                    return;
                }
                await updateScheduleRate(`cron(${cronExpression})`);
            }
            setStatus('Schedule rate updated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule rate';
            console.error('Error:', error);
            setStatus(`Error: ${errorMessage}`);
        }
    };

    useEffect(() => {
        fetchCurrentRate();
    }, []);

    return [
        { rateType, value, unit, cronExpression, status, isLoading },
        { setRateType, setValue, setUnit, setCronExpression, handleUpdate, refresh: fetchCurrentRate }
    ];
} 