export const MUSICBRAINZ_API_BASE_URL = 'https://musicbrainz.org/ws/2';
export const REDIS_URL = process.env.UPSTASH_REDIS_URL || '';
export const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN || '';
export const CACHE_TTL = 3600; // 1 hour TTL for cache
export const APP_USER_AGENT = 'MusicMarioLopez/0.0.1 (https://music.mariolopez.org)';
export const MAX_REQUESTS_PER_SECOND = 1; // MusicBrainz rate limit: 1 request per second 