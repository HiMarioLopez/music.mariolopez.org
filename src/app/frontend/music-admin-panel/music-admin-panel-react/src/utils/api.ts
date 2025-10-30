import { fetchAuthSession } from "aws-amplify/auth";

interface ApiOptions {
  method: "GET" | "POST";
  path: string;
  body?: any;
  baseUrl?: string;
  requiresAuth?: boolean;
}

async function getAuthToken() {
  const { tokens } = await fetchAuthSession();
  const idToken = tokens?.idToken?.toString();
  if (!idToken) {
    throw new Error("No valid authentication token found");
  }

  console.log("Auth Token:", {
    preview: `${idToken.slice(0, 20)}...${idToken.slice(-20)}`,
    length: idToken.length,
  });

  return idToken;
}

async function apiRequest<T>({
  method,
  path,
  body,
  baseUrl,
  requiresAuth = true,
}: ApiOptions): Promise<T> {
  const url = `${
    baseUrl || import.meta.env.VITE_ADMIN_API_BASE_URL
  }/api/nodejs/v1/${path}`;
  console.log("Making request to:", url);

  const headers: Record<string, string> = {};

  if (requiresAuth) {
    const idToken = await getAuthToken();
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  console.log("Request headers:", headers);

  const response = await fetch(url, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  console.log("Response status:", response.status);
  console.log(
    "Response headers:",
    Object.fromEntries(response.headers.entries())
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response body:", errorText);
    throw new Error(`API request failed: ${response.statusText}`);
  }

  if (method === "GET") {
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Invalid JSON response from server");
    }
  }

  return response as T;
}

// API Functions
export async function updateMusicUserToken(musicUserToken: string) {
  return apiRequest({
    method: "POST",
    path: "apple/mut",
    body: { musicUserToken },
  });
}

export async function getMusicUserToken() {
  const response = await apiRequest<{ musicUserToken: string }>({
    method: "GET",
    path: "apple/mut",
  });
  return response.musicUserToken;
}

export interface MusicUserTokenStatusResponse {
  authorized: boolean;
  message: string;
  musicUserToken: string | null;
}

export async function getMusicUserTokenStatus() {
  return apiRequest<MusicUserTokenStatusResponse>({
    method: "GET",
    path: "apple/mut/status",
  });
}

export async function fetchDeveloperToken() {
  const response = await apiRequest<{ token: string }>({
    method: "GET",
    path: "auth/token",
    baseUrl: import.meta.env.VITE_MUSIC_API_BASE_URL,
    requiresAuth: false,
  });

  if (!response.token) {
    throw new Error("No token found in response");
  }

  return response.token;
}

export async function updateScheduleRate(rate: string) {
  return apiRequest({
    method: "POST",
    path: "schedule",
    body: { rate },
  });
}

export async function getScheduleRate() {
  return apiRequest<{ rate: string }>({
    method: "GET",
    path: "schedule",
  });
}

export async function updateSongLimit(songLimit: number) {
  return apiRequest({
    method: "POST",
    path: "song-limit",
    body: { songLimit },
  });
}

export async function getSongLimit() {
  return apiRequest<{ songLimit: number }>({
    method: "GET",
    path: "song-limit",
  });
}

// Spotify OAuth API Functions
export interface SpotifyOAuthUrlResponse {
  authorization_url: string;
  state: string;
  // code_verifier is handled server-side
}

export interface SpotifyStatusResponse {
  authorized: boolean;
  message: string;
}

export async function getSpotifyOAuthUrl() {
  return apiRequest<SpotifyOAuthUrlResponse>({
    method: "GET",
    path: "spotify/oauth/url",
  });
}

export async function getSpotifyStatus() {
  return apiRequest<SpotifyStatusResponse>({
    method: "GET",
    path: "spotify/status",
  });
}

export async function getSpotifyToken() {
  return apiRequest<{ accessToken: string }>({
    method: "GET",
    path: "spotify/token",
  });
}
