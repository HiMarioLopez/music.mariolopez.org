import { useState, useEffect } from 'react';
import { updateScheduleRate, getScheduleRate } from '../utils/api';

export type RateUnit = 'minutes' | 'hours' | 'days';
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

    useEffect(() => {
        fetchCurrentRate();
    }, []);

    return [
        { rateType, value, unit, cronExpression, status, isLoading },
        { setRateType, setValue, setUnit, setCronExpression, handleUpdate }
    ];
} 