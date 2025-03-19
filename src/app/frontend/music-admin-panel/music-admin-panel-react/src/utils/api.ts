import { fetchAuthSession } from 'aws-amplify/auth';

export async function storeMusicUserToken(musicUserToken: string) {
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken?.toString()) {
        throw new Error('No valid authentication token found');
    }

    const idToken = tokens.idToken.toString();
    console.log('Auth Token:', {
        full: idToken,
        preview: `${idToken.slice(0, 20)}...${idToken.slice(-20)}`,
        length: idToken.length
    });

    const url = `${import.meta.env.VITE_ADMIN_API_BASE_URL}/api/nodejs/mut/store`;
    console.log('Making request to:', url);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
    };
    console.log('Request headers:', headers);

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ musicUserToken }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to store token: ${response.statusText}`);
    }

    return response;
}

export async function fetchDeveloperToken() {
    const baseUrl = import.meta.env.VITE_MUSIC_API_BASE_URL;
    console.log('Fetching from:', `${baseUrl}/api/nodejs/auth/token`);

    const response = await fetch(`${baseUrl}/api/nodejs/auth/token`, {
        method: 'GET',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
        throw new Error('Failed to fetch developer token');
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
    }

    console.log('Parsed data:', data);

    if (!data.token) {
        throw new Error('No token found in response');
    }

    return data.token;
}

export async function updateScheduleRate(rate: string) {
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken?.toString()) {
        throw new Error('No valid authentication token found');
    }

    const idToken = tokens.idToken.toString();
    const url = `${import.meta.env.VITE_ADMIN_API_BASE_URL}/api/nodejs/schedule/update`;
    console.log('Making request to:', url);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
    };
    console.log('Request headers:', headers);

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rate }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to update schedule: ${response.statusText}`);
    }

    return response;
} 