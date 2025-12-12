import { MusicHistoryResponse } from "../models/MusicHistoryResponse";

/**
 * For static export builds we cannot rely on Next.js rewrites.
 * - If NEXT_PUBLIC_API_ORIGIN is set, we call the backend with an absolute URL.
 * - Otherwise we default to same-origin (/api/...), which works when the API is served
 *   on the same domain as the static site.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/$/, "");
const API_BASE_URL = `${API_ORIGIN}/api/nodejs/v1`;

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
    this.name = "ApiError";
  }
}

// Fetch wrapper with error handling
const fetchWithErrorHandling = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(`API error: ${response.statusText}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      500,
    );
  }
};

// Authentication service
export const authService = {
  // Storage keys
  STORAGE_TOKEN_KEY: "music_app_auth_token",
  STORAGE_EXPIRES_KEY: "music_app_auth_expires_at",

  async getDeveloperToken(): Promise<string> {
    const data = await fetchWithErrorHandling<AuthResponse>(
      `${API_BASE_URL}/auth/token`,
    );

    if (!data.token) {
      throw new ApiError("Failed to retrieve authentication token", 401);
    }

    return data.token;
  },

  // Helper to cache and manage token
  token: null as string | null,
  tokenExpiresAt: null as number | null,
  tokenRefreshPromise: null as Promise<string> | null,

  // Load persisted token from storage
  loadPersistedToken(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    try {
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
      console.warn("Failed to load persisted token:", error);
    }
    return false;
  },

  // Persist token to storage
  persistToken(token: string, expiresAt: number): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
      localStorage.setItem(this.STORAGE_EXPIRES_KEY, expiresAt.toString());
    } catch (error) {
      console.warn("Failed to persist token:", error);
    }
  },

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
      return this.token;
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
  },

  clearToken() {
    this.token = null;
    this.tokenExpiresAt = null;
    this.tokenRefreshPromise = null;
    // Also clear from storage
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.removeItem(this.STORAGE_TOKEN_KEY);
      localStorage.removeItem(this.STORAGE_EXPIRES_KEY);
    } catch (error) {
      console.warn("Failed to clear persisted token:", error);
    }
  },
};

// Try to load persisted token during module initialization
if (typeof window !== "undefined") {
  authService.loadPersistedToken();
}

// Export a unified API service
export const apiService = {
  // Music history API methods
  async getMusicHistory(limit: number = 5): Promise<MusicHistoryResponse> {
    return fetchWithErrorHandling<MusicHistoryResponse>(
      `${API_BASE_URL}/history/music?limit=${limit}`,
    );
  },
  async getSpotifyMusicHistory(
    limit: number = 5,
  ): Promise<MusicHistoryResponse> {
    return fetchWithErrorHandling<MusicHistoryResponse>(
      `${API_BASE_URL}/history/spotify?limit=${limit}`,
    );
  },
};
