export const APPLE_MUSIC_API_BASE_URL = 'https://api.music.apple.com/v1';
export const APPLE_MUSIC_TOKEN_PARAM_NAME = '/Music/AdminPanel/MUT';
export const TOKEN_REFRESH_SNS_TOPIC_ARN = process.env.TOKEN_REFRESH_SNS_TOPIC_ARN || '';
export const FAILED_REQUESTS_SQS_URL = process.env.FAILED_REQUESTS_SQS_URL || '';
export const REDIS_URL = process.env.UPSTASH_REDIS_URL || '';
export const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN || '';
export const CACHE_TTL = 60 * 1000; // 1 minute TTL for L1 cache 