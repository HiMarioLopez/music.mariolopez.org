import { fetchAuthSession } from 'aws-amplify/auth';

interface ApiOptions {
    method: 'GET' | 'POST';
    path: string;
    body?: any;
    baseUrl?: string;
    requiresAuth?: boolean;
}

async function getAuthToken() {
    const { tokens } = await fetchAuthSession();
    const idToken = tokens?.idToken?.toString();
    if (!idToken) {
        throw new Error('No valid authentication token found');
    }

    console.log('Auth Token:', {
        preview: `${idToken.slice(0, 20)}...${idToken.slice(-20)}`,
        length: idToken.length
    });

    return idToken;
}

async function apiRequest<T>({ method, path, body, baseUrl, requiresAuth = true }: ApiOptions): Promise<T> {
    const url = `${baseUrl || import.meta.env.VITE_ADMIN_API_BASE_URL}/api/nodejs/${path}`;
    console.log('Making request to:', url);

    const headers: Record<string, string> = {};

    if (requiresAuth) {
        const idToken = await getAuthToken();
        headers['Authorization'] = `Bearer ${idToken}`;
    }

    console.log('Request headers:', headers);

    const response = await fetch(url, {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`API request failed: ${response.statusText}`);
    }

    if (method === 'GET') {
        const responseText = await response.text();
        try {
            return JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
    }

    return response as T;
}

// API Functions
export async function updateMusicUserToken(musicUserToken: string) {
    return apiRequest({
        method: 'POST',
        path: 'mut/update',
        body: { musicUserToken }
    });
}

export async function fetchDeveloperToken() {
    const response = await apiRequest<{ token: string }>({
        method: 'GET',
        path: 'auth/token',
        baseUrl: import.meta.env.VITE_MUSIC_API_BASE_URL,
        requiresAuth: false
    });

    if (!response.token) {
        throw new Error('No token found in response');
    }

    return response.token;
}

export async function updateScheduleRate(rate: string) {
    return apiRequest({
        method: 'POST',
        path: 'schedule/update',
        body: { rate }
    });
}

export async function getScheduleRate() {
    return apiRequest<{ rate: string }>({
        method: 'GET',
        path: 'schedule/get'
    });
}

export async function updateTrackLimit(trackLimit: number) {
    return apiRequest({
        method: 'POST',
        path: 'track-limit/update',
        body: { trackLimit }
    });
}

export async function getTrackLimit() {
    return apiRequest<{ trackLimit: number }>({
        method: 'GET',
        path: 'track-limit/get'
    });
} 