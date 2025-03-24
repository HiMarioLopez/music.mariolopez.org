import { useState, useEffect } from 'react';
import { updateTrackLimit, getTrackLimit } from '../utils/api';

interface TrackLimitState {
    value: number;
    status: string;
    isLoading: boolean;
}

interface TrackLimitActions {
    setValue: (value: number) => void;
    handleUpdate: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useTrackLimit(): [TrackLimitState, TrackLimitActions] {
    const [value, setValue] = useState(25); // Default value
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchCurrentLimit = async () => {
        try {
            setIsLoading(true);
            const response = await getTrackLimit();
            setValue(response.trackLimit);
        } catch (error) {
            console.error('Error fetching track limit:', error);
            setStatus('Error: Failed to fetch current track limit');
        } finally {
            setIsLoading(false);
        }
    };

    const validateTrackLimit = (value: number): string | null => {
        if (value < 5) return "Track limit must be at least 5";
        if (value > 30) return "Track limit cannot exceed 30";
        return null;
    };

    const handleUpdate = async () => {
        try {
            const error = validateTrackLimit(value);
            if (error) {
                setStatus(`Error: ${error}`);
                return;
            }

            await updateTrackLimit(value);
            setStatus('Track limit updated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update track limit';
            console.error('Error:', error);
            setStatus(`Error: ${errorMessage}`);
        }
    };

    useEffect(() => {
        fetchCurrentLimit();
    }, []);

    return [
        { value, status, isLoading },
        { setValue, handleUpdate, refresh: fetchCurrentLimit }
    ];
} 