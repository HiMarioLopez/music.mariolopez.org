import { useState } from 'react';
import { fetchDeveloperToken } from '../utils/api';

interface DeveloperTokenState {
    token: string | null;
    isLoading: boolean;
    error: string | null;
    lastFetched: Date | null;
}

export function useDeveloperToken() {
    const [state, setState] = useState<DeveloperTokenState>({
        token: null,
        isLoading: false,
        error: null,
        lastFetched: null,
    });

    const fetchToken = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const token = await fetchDeveloperToken();
            setState(prev => ({
                ...prev,
                token,
                lastFetched: new Date(),
                isLoading: false,
            }));
            return token;
        } catch (err) {
            console.error('Full error:', err);
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'An error occurred',
                isLoading: false,
            }));
            throw err;
        }
    };

    const formatTimestamp = (date: Date) => {
        return `${date.toLocaleTimeString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
    };

    return {
        ...state,
        fetchToken,
        formatTimestamp,
    };
} 