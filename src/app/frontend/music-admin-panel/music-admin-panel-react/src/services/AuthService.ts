// services/apiService.ts
import axios from 'axios';

class AuthService {
    private static instance: AuthService;
    private baseURL: string;

    private constructor() {
        this.baseURL = 'https://music.mariolopez.org/api/nodejs';
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async getDeveloperToken(): Promise<string> {
        try {
            const response = await axios.get(`${this.baseURL}/auth/token`);
            return response.data.token;
        } catch (error) {
            console.error('Error fetching developer token:', error);
            throw error;
        }
    }
}

export default AuthService;