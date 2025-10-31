import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { MusicHistoryResponse } from '../models/music-history-response';

const API_BASE_URL = '/api/nodejs/v1';

// Type for authentication response
interface AuthResponse {
  token: string;
  expiresAt?: number;
}

// Error handling class
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Storage keys
  private readonly STORAGE_TOKEN_KEY = 'music_app_auth_token';
  private readonly STORAGE_EXPIRES_KEY = 'music_app_auth_expires_at';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private token: string | null = null;
  private tokenExpiresAt: number | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(private http: HttpClient) {
    this.loadPersistedToken();
  }

  // Load persisted token from storage
  private loadPersistedToken(): boolean {
    try {
      if (!this.isBrowser) {
        return false;
      }

      const storedToken = localStorage.getItem(this.STORAGE_TOKEN_KEY);
      const storedExpiresAt = localStorage.getItem(this.STORAGE_EXPIRES_KEY);

      if (storedToken && storedExpiresAt) {
        const expiresAt = parseInt(storedExpiresAt, 10);
        // Only use stored token if it's not expired (with 5 min buffer)
        if (expiresAt > Date.now() + 300000) {
          this.token = storedToken;
          this.tokenExpiresAt = expiresAt;
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted token:', error);
    }
    return false;
  }

  // Persist token to storage
  private persistToken(token: string, expiresAt: number): void {
    try {
      if (!this.isBrowser) {
        return;
      }
      
      localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
      localStorage.setItem(this.STORAGE_EXPIRES_KEY, expiresAt.toString());
    } catch (error) {
      console.warn('Failed to persist token:', error);
    }
  }

  async getDeveloperToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.get<AuthResponse>(`${API_BASE_URL}/auth/token`).pipe(
          catchError((error: HttpErrorResponse) =>
            throwError(() => new ApiError(`API error: ${error.statusText}`, error.status))
          )
        )
      );

      if (!response.token) {
        throw new ApiError('Failed to retrieve authentication token', 401);
      }

      return response.token;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ApiError(message, 500);
    }
  }

  async getTokenWithCache(): Promise<string> {
    // If not loaded yet, try to load from storage first
    if (!this.token && !this.tokenRefreshPromise) {
      this.loadPersistedToken();
    }

    // If a refresh is already in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    // Check if token exists and is not expired (with 5 min buffer)
    const now = Date.now();
    if (
      this.token &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > now + 300000
    ) {
      return Promise.resolve(this.token);
    }

    // Fetch new token only when needed
    this.tokenRefreshPromise = this.getDeveloperToken()
      .then((token) => {
        this.token = token;
        // Store expiration time (default to 1 hour if not specified)
        this.tokenExpiresAt = Date.now() + 3600000;
        // Persist to localStorage
        this.persistToken(token, this.tokenExpiresAt);
        this.tokenRefreshPromise = null;
        return token;
      })
      .catch((error) => {
        this.tokenRefreshPromise = null;
        throw error;
      });

    return this.tokenRefreshPromise;
  }

  clearToken(): void {
    this.token = null;
    this.tokenExpiresAt = null;
    this.tokenRefreshPromise = null;
    // Also clear from storage
    try {
      if (!this.isBrowser) {
        return;
      }
      localStorage.removeItem(this.STORAGE_TOKEN_KEY);
      localStorage.removeItem(this.STORAGE_EXPIRES_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted token:', error);
    }
  }

  // Music history API methods
  getMusicHistory(limit: number = 5): Observable<MusicHistoryResponse> {
    return this.http.get<MusicHistoryResponse>(
      `${API_BASE_URL}/history/music?limit=${limit}`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new ApiError(
          `API error: ${error.statusText}`,
          error.status
        ));
      })
    );
  }

  getSpotifyMusicHistory(limit: number = 5): Observable<MusicHistoryResponse> {
    return this.http.get<MusicHistoryResponse>(
      `${API_BASE_URL}/history/spotify?limit=${limit}`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new ApiError(
          `API error: ${error.statusText}`,
          error.status
        ));
      })
    );
  }
}

